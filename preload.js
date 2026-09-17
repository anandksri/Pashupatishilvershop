/**
 * Secure Electron Preload Bridge
 * Exposes safe, validated IPC APIs to the renderer window
 * Does NOT expose raw ipcRenderer or node modules directly
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  getBills: () => ipcRenderer.invoke('db:getBills'),
  getBillById: (id) => ipcRenderer.invoke('db:getBillById', id),
  saveBill: (bill, imageDataUrl) => ipcRenderer.invoke('db:saveBill', { bill, imageDataUrl }),
  deleteBill: (id) => ipcRenderer.invoke('db:deleteBill', id),
  getSettings: () => ipcRenderer.invoke('db:getSettings'),
  saveSettings: (settings) => ipcRenderer.invoke('db:saveSettings', settings),
  getNextSerial: () => ipcRenderer.invoke('db:getNextSerial'),

  // Native Windows printing operations
  printBill: (options) => ipcRenderer.invoke('print:bill', options),
  getPrinters: () => ipcRenderer.invoke('print:getPrinters'),
  captureBillImage: (rect) => ipcRenderer.invoke('print:capture-bill-image', rect),

  // Google Drive & Backup operations
  getDriveStatus: () => ipcRenderer.invoke('drive:getStatus'),
  backupToDrive: (data) => ipcRenderer.invoke('drive:backup', data),
  exportDatabase: () => ipcRenderer.invoke('backup:export'),
  importDatabase: () => ipcRenderer.invoke('backup:import'),

  // App info & platform
  platform: process.platform,
  isElectron: true,
});
