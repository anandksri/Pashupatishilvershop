require('dotenv').config();
const { google } = require('googleapis');

const DESTINATION_EMAIL = 'pashupatisilverhouse2025@gmail.com';

class GoogleDriveBackupManager {
  constructor() {
    this.clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || '';
    this.refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '';
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
    this.apiKey = process.env.GOOGLE_DRIVE_API_KEY || '';
    this.drive = null;
  }

  getStatus() {
    const configured = Boolean(this.clientId && this.clientSecret && this.refreshToken);
    return {
      configured,
      authenticated: Boolean(this.drive),
      destinationEmail: DESTINATION_EMAIL,
      message: configured
        ? `Google Drive uploads target ${DESTINATION_EMAIL}.`
        : `Google Drive is not configured for ${DESTINATION_EMAIL}. Set OAuth client ID, client secret, and refresh token.`,
    };
  }

  configure(clientId, clientSecret, refreshToken, folderId = '') {
    this.clientId = clientId || '';
    this.clientSecret = clientSecret || '';
    this.refreshToken = refreshToken || '';
    this.folderId = folderId || '';
    this.drive = null;
    return this.getStatus();
  }

  getDriveClient() {
    if (!this.clientId || !this.clientSecret || !this.refreshToken) {
      return null;
    }

    if (!this.drive) {
      const auth = new google.auth.OAuth2(this.clientId, this.clientSecret);
      auth.setCredentials({ refresh_token: this.refreshToken });
      this.drive = google.drive({ version: 'v3', auth });
    }

    return this.drive;
  }

  async backupBill(bill, imageDataUrl) {
    const drive = this.getDriveClient();
    if (!drive) {
      return {
        success: false,
        error: `Google Drive is not configured for ${DESTINATION_EMAIL}.`,
      };
    }

    const fileName = `bill_${bill.slNo || bill.id}.png`;
    const request = {
      q: `trashed = false and appProperties has { key = 'shambhuBillId' and value = '${bill.id}' }`,
      spaces: 'drive',
      fields: 'files(id, name, mimeType, webViewLink)',
      pageSize: 1,
    };
    if (this.folderId) {
      request.q = `'${this.folderId}' in parents and ${request.q}`;
    }

    const existing = await drive.files.list(request);
    const metadata = {
      name: fileName,
      mimeType: 'image/png',
      appProperties: { shambhuBillId: String(bill.id) },
      ...(this.folderId ? { parents: [this.folderId] } : {}),
    };

    if (!imageDataUrl || !imageDataUrl.startsWith('data:image/png;base64,')) {
      throw new Error('A print-view PNG is required for Google Drive backup.');
    }

    const media = {
      mimeType: 'image/png',
      body: Buffer.from(imageDataUrl.slice('data:image/png;base64,'.length), 'base64'),
    };
    const existingFile = existing.data.files?.[0];
    let response;
    let updated = false;

    if (existingFile?.mimeType === 'image/png') {
      response = await drive.files.update({
        fileId: existingFile.id,
        requestBody: metadata,
        media,
        fields: 'id, name, webViewLink',
      });
      updated = true;
    } else {
      response = await drive.files.create({
        requestBody: metadata,
        media,
        fields: 'id, name, webViewLink',
      });

      // Replace legacy JSON backups after the new image has been created successfully.
      if (existingFile?.id) {
        try {
          await drive.files.delete({ fileId: existingFile.id });
        } catch (error) {
          // A legacy file may be read-only; keep the successful PNG upload.
          console.warn('[Google Drive] Could not remove legacy JSON backup:', error.message);
        }
        updated = true;
      }
    }

    return { success: true, file: response.data, updated };
  }

  async backupDatabase(databaseData) {
    const drive = this.getDriveClient();
    if (!drive) return { success: false, error: `Google Drive is not configured for ${DESTINATION_EMAIL}.` };

    const metadata = {
      name: `shambhu_ji_backup_${new Date().toISOString().slice(0, 10)}.json`,
      mimeType: 'application/json',
      ...(this.folderId ? { parents: [this.folderId] } : {}),
    };
    const response = await drive.files.create({
      requestBody: metadata,
      media: { mimeType: 'application/json', body: JSON.stringify(databaseData, null, 2) },
      fields: 'id, name, webViewLink',
    });
    return { success: true, file: response.data };
  }

  async restoreDatabase(fileId) {
    if (!this.getDriveClient()) {
      throw new Error('Google Drive backup is not configured.');
    }
    const response = await this.drive.files.get({ fileId, alt: 'media' });
    return response.data;
  }

  async listBackups() {
    if (!this.getDriveClient()) {
      return [];
    }
    const response = await this.drive.files.list({
      q: `trashed = false${this.folderId ? ` and '${this.folderId}' in parents` : ''}`,
      orderBy: 'createdTime desc',
      fields: 'files(id, name, createdTime, webViewLink)',
    });
    return response.data.files || [];
  }
}

const driveManager = new GoogleDriveBackupManager();

module.exports = driveManager;
module.exports.GoogleDriveBackupManager = GoogleDriveBackupManager;
module.exports.default = driveManager;
