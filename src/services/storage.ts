import { Bill, AppSettings } from '../types';

const BILLS_KEY = 'shambhu_ji_bills_db';
const SETTINGS_KEY = 'shambhu_ji_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  shopName: 'SHAMBHU JI RXL',
  defaultBillType: 'ROUGH ESTIMATE',
  footerNote: 'Only Agra Item Will Be Return...',
  autoIncrementSerial: true,
  lastSerial: 7,
  finePrecision: 0,
};

// Check if running inside Electron with IPC bridge
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

export const StorageService = {
  /**
   * Fetch all bills, ordered by newest first
   */
  async getBills(): Promise<Bill[]> {
    if (isElectron) {
      try {
        return await (window as any).electronAPI.getBills();
      } catch (err) {
        console.error('Electron IPC getBills error:', err);
      }
    }

    try {
      const data = localStorage.getItem(BILLS_KEY);
      if (!data) return [];
      const bills: Bill[] = JSON.parse(data);
      return bills.sort((a, b) => b.createdAt - a.createdAt);
    } catch (err) {
      console.error('Error getting bills from storage:', err);
      return [];
    }
  },

  /**
   * Get single bill by ID
   */
  async getBillById(id: string): Promise<Bill | null> {
    if (isElectron) {
      try {
        return await (window as any).electronAPI.getBillById(id);
      } catch (err) {
        console.error('Electron IPC getBillById error:', err);
      }
    }

    const bills = await this.getBills();
    return bills.find((b) => b.id === id) || null;
  },

  /**
   * Save a new bill or update existing
   */
  async saveBill(bill: Bill, imageDataUrl?: string): Promise<{ success: boolean; bill: Bill; message: string }> {
    bill.updatedAt = Date.now();

    if (isElectron) {
      try {
        const res = await (window as any).electronAPI.saveBill(bill, imageDataUrl);
        return res;
      } catch (err: any) {
        console.error('Electron IPC saveBill error:', err);
        return { success: false, bill, message: err?.message || 'Error saving to Electron storage' };
      }
    }

    try {
      const bills = await this.getBills();
      const existingIndex = bills.findIndex((b) => b.id === bill.id);

      if (existingIndex >= 0) {
        bills[existingIndex] = bill;
      } else {
        bills.unshift(bill);
      }

      localStorage.setItem(BILLS_KEY, JSON.stringify(bills));

      // Update serial number if applicable
      const numericSerial = parseInt(bill.slNo.replace(/\D/g, ''), 10);
      if (!isNaN(numericSerial)) {
        const settings = await this.getSettings();
        if (numericSerial >= settings.lastSerial) {
          settings.lastSerial = numericSerial;
          await this.saveSettings(settings);
        }
      }

      return {
        success: true,
        bill,
        message: existingIndex >= 0 ? 'Bill updated successfully.' : 'Bill saved successfully.',
      };
    } catch (err: any) {
      console.error('Error saving bill:', err);
      return { success: false, bill, message: 'Unable to save bill to local storage.' };
    }
  },

  /**
   * Delete a bill
   */
  async deleteBill(id: string): Promise<boolean> {
    if (isElectron) {
      try {
        return await (window as any).electronAPI.deleteBill(id);
      } catch (err) {
        console.error('Electron IPC deleteBill error:', err);
      }
    }

    try {
      const bills = await this.getBills();
      const filtered = bills.filter((b) => b.id !== id);
      localStorage.setItem(BILLS_KEY, JSON.stringify(filtered));
      return true;
    } catch (err) {
      console.error('Error deleting bill:', err);
      return false;
    }
  },

  /**
   * Get next suggested serial number
   */
  async getNextSerial(): Promise<string> {
    const settings = await this.getSettings();
    if (settings.autoIncrementSerial) {
      return String(settings.lastSerial + 1);
    }
    return String(settings.lastSerial || 1);
  },

  /**
   * Fetch app settings
   */
  async getSettings(): Promise<AppSettings> {
    if (isElectron) {
      try {
        return await (window as any).electronAPI.getSettings();
      } catch (err) {
        console.error('Electron IPC getSettings error:', err);
      }
    }

    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (err) {
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Save app settings
   */
  async saveSettings(settings: AppSettings): Promise<boolean> {
    if (isElectron) {
      try {
        return await (window as any).electronAPI.saveSettings(settings);
      } catch (err) {
        console.error('Electron IPC saveSettings error:', err);
      }
    }

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (err) {
      console.error('Error saving settings:', err);
      return false;
    }
  },

  /**
   * Export all data as JSON
   */
  async exportData(): Promise<string> {
    const bills = await this.getBills();
    const settings = await this.getSettings();
    return JSON.stringify({ bills, settings, exportDate: new Date().toISOString() }, null, 2);
  },

  /**
   * Import data from JSON
   */
  async importData(jsonString: string): Promise<{ success: boolean; count: number }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.bills)) {
        return { success: false, count: 0 };
      }
      localStorage.setItem(BILLS_KEY, JSON.stringify(parsed.bills));
      if (parsed.settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed.settings));
      }
      return { success: true, count: parsed.bills.length };
    } catch (err) {
      console.error('Import error:', err);
      return { success: false, count: 0 };
    }
  },
};
