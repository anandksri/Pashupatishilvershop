import React, { useState } from 'react';
import { Cloud, Download, Upload, AlertCircle, X, Database } from 'lucide-react';
import { StorageService } from '../services/storage';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [clientId, setClientId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'info' | 'error' | 'success';
  }>({
    text: 'Bills are uploaded automatically after saving when Google Drive OAuth is configured.',
    type: 'info',
  });

  if (!isOpen) return null;

  const handleExportJSON = async () => {
    try {
      const dataStr = await StorageService.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shambhu_ji_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatusMessage({
        text: 'Local database backup exported successfully to JSON file.',
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({
        text: 'Export failed: ' + (err?.message || 'Unknown error'),
        type: 'error',
      });
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = await StorageService.importData(text);
        if (res.success) {
          setStatusMessage({
            text: `Successfully restored ${res.count} bills from backup!`,
            type: 'success',
          });
          onDataRestored();
        } else {
          setStatusMessage({
            text: 'Failed to restore: Invalid backup file structure.',
            type: 'error',
          });
        }
      } catch (err: any) {
        setStatusMessage({
          text: 'Error parsing backup file: ' + err.message,
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDriveAction = (actionName: string) => {
    setStatusMessage({
      text: `${actionName} is handled automatically as a print-view PNG when a bill is saved. Configure the OAuth variables described in README.md for the ${'pashupatisilverhouse2025@gmail.com'} Drive account.`,
      type: 'error',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-xl border border-neutral-300">
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-black text-neutral-900 uppercase tracking-wide">
              Backup & Restore
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-200 rounded text-neutral-500 hover:text-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Status banner */}
          <div
            className={`p-3 rounded border flex items-start space-x-2.5 ${
              statusMessage.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : statusMessage.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="font-semibold text-xs leading-relaxed">
              {statusMessage.text}
            </div>
          </div>

          {/* Section 1: Offline Local Database Backup (Always 100% functional) */}
          <div className="border border-neutral-200 rounded p-4 bg-neutral-50">
            <div className="flex items-center space-x-2 mb-2 font-bold text-neutral-900 uppercase">
              <Database className="w-4 h-4 text-neutral-700" />
              <span>Offline Database Backup (JSON Export / Import)</span>
            </div>
            <p className="text-neutral-600 mb-3 leading-normal">
              Download your entire bill archive and database to a secure local file, or restore from a previously saved JSON backup.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded font-bold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Database to JSON</span>
              </button>
              <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded font-bold cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Restore from JSON File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Google Drive Cloud Architecture */}
          <div className="border border-neutral-200 rounded p-4">
            <div className="flex items-center space-x-2 mb-2 font-bold text-neutral-900 uppercase">
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>Google Drive Cloud Architecture</span>
            </div>
            <p className="text-neutral-500 mb-3 leading-normal">
              Bill saves are uploaded automatically as print-view PNG images to the configured Google Drive account. Set the OAuth variables in the app environment before launching Electron.
            </p>

            <div className="space-y-2 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-0.5">
                  Google Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                  className="w-full px-2.5 py-1 text-xs border border-neutral-300 rounded focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-0.5">
                  Google Drive API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API Key"
                  className="w-full px-2.5 py-1 text-xs border border-neutral-300 rounded focus:border-black focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDriveAction('Backup Database to Google Drive')}
                className="px-3 py-1.5 border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-100 font-semibold text-center"
              >
                Backup DB to Drive
              </button>
              <button
                type="button"
                onClick={() => handleDriveAction('Backup Bills to Google Drive')}
                className="px-3 py-1.5 border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-100 font-semibold text-center"
              >
                Backup Bills to Drive
              </button>
              <button
                type="button"
                onClick={() => handleDriveAction('Restore Database from Google Drive')}
                className="px-3 py-1.5 border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-100 font-semibold text-center"
              >
                Restore DB from Drive
              </button>
              <button
                type="button"
                onClick={() => handleDriveAction('Restore Bills from Google Drive')}
                className="px-3 py-1.5 border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-100 font-semibold text-center"
              >
                Restore Bills from Drive
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-200 rounded border border-neutral-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
