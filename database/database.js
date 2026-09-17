/**
 * Persistent Local Database for Shambhu Ji RXL Billing
 * Avoids native module ABI issues (no better-sqlite3 compilation needed).
 * Persists bills, bill_items, and settings inside Electron's userData directory.
 * Survives application restarts with atomic file persistence.
 */

const fs = require('fs');
const path = require('path');

class LocalDatabase {
  constructor() {
    this.dbDir = null;
    this.dbFile = null;
    this.settingsFile = null;
    this.isInitialized = false;
    this.billsCache = [];
    this.settingsCache = null;
  }

  /**
   * Initializes database file paths in Electron userData directory or local fallback
   */
  init(appUserDataPath) {
    if (this.isInitialized) return;

    if (appUserDataPath) {
      this.dbDir = path.join(appUserDataPath, 'shambhu_ji_data');
    } else {
      this.dbDir = path.join(process.cwd(), 'data');
    }

    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }

    this.dbFile = path.join(this.dbDir, 'bills.json');
    this.settingsFile = path.join(this.dbDir, 'settings.json');

    // Load initial data
    this.loadData();
    this.isInitialized = true;
    console.log(`[Database] Initialized successfully at: ${this.dbDir}`);
  }

  loadData() {
    try {
      if (fs.existsSync(this.dbFile)) {
        const raw = fs.readFileSync(this.dbFile, 'utf8');
        this.billsCache = JSON.parse(raw);
        if (!Array.isArray(this.billsCache)) {
          this.billsCache = [];
        }
      } else {
        this.billsCache = [];
        this.saveBillsToDisk();
      }
    } catch (err) {
      console.error('[Database] Error loading bills file:', err);
      this.billsCache = [];
    }

    try {
      if (fs.existsSync(this.settingsFile)) {
        const raw = fs.readFileSync(this.settingsFile, 'utf8');
        this.settingsCache = JSON.parse(raw);
      } else {
        this.settingsCache = {
          shopName: 'SHAMBHU JI RXL',
          defaultBillType: 'ROUGH ESTIMATE',
          footerNote: 'Only Agra Item Will Be Return...',
          autoIncrementSerial: true,
          lastSerial: 7,
          finePrecision: 0,
        };
        this.saveSettingsToDisk();
      }
    } catch (err) {
      console.error('[Database] Error loading settings file:', err);
    }
  }

  /**
   * Atomic safe save to disk using temporary file
   */
  saveBillsToDisk() {
    if (!this.dbFile) return;
    const tempFile = `${this.dbFile}.tmp`;
    const dataStr = JSON.stringify(this.billsCache, null, 2);
    fs.writeFileSync(tempFile, dataStr, 'utf8');
    fs.renameSync(tempFile, this.dbFile);
  }

  saveSettingsToDisk() {
    if (!this.settingsFile) return;
    const tempFile = `${this.settingsFile}.tmp`;
    const dataStr = JSON.stringify(this.settingsCache, null, 2);
    fs.writeFileSync(tempFile, dataStr, 'utf8');
    fs.renameSync(tempFile, this.settingsFile);
  }

  getBills() {
    // Return newest bills first
    return [...this.billsCache].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  getBillById(id) {
    return this.billsCache.find((b) => b.id === id) || null;
  }

  saveBill(bill) {
    if (!bill || !bill.id) {
      throw new Error('Invalid bill record');
    }

    const index = this.billsCache.findIndex((b) => b.id === bill.id);
    bill.updatedAt = Date.now();

    if (index >= 0) {
      // Update existing
      this.billsCache[index] = bill;
    } else {
      // Insert new
      if (!bill.createdAt) bill.createdAt = Date.now();
      this.billsCache.unshift(bill);
    }

    // Auto-update serial number in settings
    const numericSerial = parseInt(String(bill.slNo).replace(/\D/g, ''), 10);
    if (!isNaN(numericSerial) && this.settingsCache) {
      if (numericSerial >= (this.settingsCache.lastSerial || 0)) {
        this.settingsCache.lastSerial = numericSerial;
        this.saveSettingsToDisk();
      }
    }

    this.saveBillsToDisk();
    return {
      success: true,
      bill,
      message: index >= 0 ? 'Bill updated successfully.' : 'Bill saved successfully.',
    };
  }

  deleteBill(id) {
    const beforeCount = this.billsCache.length;
    this.billsCache = this.billsCache.filter((b) => b.id !== id);
    if (this.billsCache.length !== beforeCount) {
      this.saveBillsToDisk();
      return true;
    }
    return false;
  }

  getSettings() {
    return this.settingsCache;
  }

  saveSettings(newSettings) {
    this.settingsCache = { ...this.settingsCache, ...newSettings };
    this.saveSettingsToDisk();
    return true;
  }

  getNextSerial() {
    const last = (this.settingsCache && this.settingsCache.lastSerial) || 7;
    return String(last + 1);
  }
}

module.exports = new LocalDatabase();
