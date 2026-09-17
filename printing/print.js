/**
 * Windows Desktop Printing Manager for Shambhu Ji RXL Billing
 * Provides native Windows printer integration using Electron WebContents print API.
 */

const { BrowserWindow } = require('electron') || {};

class PrintingManager {
  constructor() {
    this.defaultOptions = {
      silent: false,
      printBackground: true,
      color: false, // black & white high contrast like physical thermal/laser jeweler bill
      margins: {
        marginType: 'printableArea',
      },
      landscape: false,
      pagesPerSheet: 1,
      collate: true,
      copies: 1,
      header: '',
      footer: '',
    };
  }

  /**
   * Print bill from active Electron window
   */
  async printActiveBill(window, customOptions = {}) {
    if (!window || window.isDestroyed()) {
      throw new Error('No active window available for printing');
    }

    const options = { ...this.defaultOptions, ...customOptions };

    return new Promise((resolve, reject) => {
      window.webContents.print(options, (success, failureReason) => {
        if (!success) {
          if (failureReason === 'cancelled') {
            resolve({ success: false, cancelled: true, message: 'Printing cancelled by user.' });
          } else {
            reject(new Error(`Windows printing failed: ${failureReason}`));
          }
        } else {
          resolve({ success: true, message: 'Print job sent successfully to Windows printer.' });
        }
      });
    });
  }

  /**
   * Export bill as PDF
   */
  async printToPDF(window, customOptions = {}) {
    if (!window || window.isDestroyed()) {
      throw new Error('No active window available for PDF export');
    }

    const pdfOptions = {
      marginsType: 1, // no margins / handled by CSS
      pageSize: 'A4',
      printBackground: true,
      printSelectionOnly: false,
      landscape: false,
      ...customOptions,
    };

    return await window.webContents.printToPDF(pdfOptions);
  }

  /**
   * Get list of installed Windows printers
   */
  async getPrinters(window) {
    if (!window || window.isDestroyed()) return [];
    return await window.webContents.getPrintersAsync();
  }
}

module.exports = new PrintingManager();
