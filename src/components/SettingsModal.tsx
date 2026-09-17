import React, { useState } from 'react';
import { AppSettings, BillType } from '../types';
import { Settings as SettingsIcon, Save, X, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);

  if (!isOpen) return null;

  const handleChange = <K extends keyof AppSettings>(field: K, value: AppSettings[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFormData({
      shopName: 'SHAMBHU JI RXL',
      defaultBillType: 'ROUGH ESTIMATE',
      footerNote: 'Only Agra Item Will Be Return...',
      autoIncrementSerial: true,
      lastSerial: 7,
      finePrecision: 0,
      defaultPrinter: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-lg border border-neutral-300">
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-neutral-800" />
            <h2 className="text-base font-black text-neutral-900 uppercase tracking-wide">
              Application Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-200 rounded text-neutral-500 hover:text-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Shop Name */}
          <div>
            <label className="block font-bold text-neutral-700 uppercase mb-1">
              Shop Name (Centered on Bill)
            </label>
            <input
              type="text"
              value={formData.shopName}
              onChange={(e) => handleChange('shopName', e.target.value)}
              className="w-full px-3 py-1.5 border border-neutral-300 rounded font-semibold focus:border-black focus:outline-none"
              placeholder="SHAMBHU JI RXL"
              required
            />
          </div>

          {/* Default Bill Type */}
          <div>
            <label className="block font-bold text-neutral-700 uppercase mb-1">
              Default Bill Type
            </label>
            <select
              value={formData.defaultBillType}
              onChange={(e) => handleChange('defaultBillType', e.target.value as BillType)}
              className="w-full px-3 py-1.5 border border-neutral-300 rounded font-semibold focus:border-black focus:outline-none"
            >
              <option value="ROUGH ESTIMATE">ROUGH ESTIMATE</option>
              <option value="FINAL BILL">FINAL BILL</option>
            </select>
          </div>

          {/* Serial Number Configuration */}
          <div className="border-t border-neutral-200 pt-3">
            <label className="block font-bold text-neutral-700 uppercase mb-1">
              Serial Number Management
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                id="auto-inc"
                checked={formData.autoIncrementSerial}
                onChange={(e) => handleChange('autoIncrementSerial', e.target.checked)}
                className="rounded text-black focus:ring-0"
              />
              <label htmlFor="auto-inc" className="text-neutral-800 font-medium">
                Auto-increment SL. NO. for each newly created bill
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-neutral-600">Last Recorded Serial:</span>
              <input
                type="number"
                value={formData.lastSerial}
                onChange={(e) => handleChange('lastSerial', parseInt(e.target.value, 10) || 0)}
                className="w-24 px-2 py-1 border border-neutral-300 rounded font-mono font-bold text-neutral-900"
              />
            </div>
          </div>

          {/* Fine Rounding Precision */}
          <div className="border-t border-neutral-200 pt-3">
            <label className="block font-bold text-neutral-700 uppercase mb-1">
              Fine Calculation Rounding
            </label>
            <select
              value={formData.finePrecision}
              onChange={(e) => handleChange('finePrecision', parseInt(e.target.value, 10))}
              className="w-full px-3 py-1.5 border border-neutral-300 rounded font-semibold focus:border-black focus:outline-none"
            >
              <option value={0}>Whole Number (Standard physical bill convention, e.g. 6)</option>
              <option value={1}>1 Decimal Place (e.g. 6.2)</option>
              <option value={2}>2 Decimal Places (e.g. 6.15)</option>
              <option value={3}>3 Decimal Places (e.g. 6.150)</option>
            </select>
          </div>

          {/* Footer Note */}
          <div className="border-t border-neutral-200 pt-3">
            <label className="block font-bold text-neutral-700 uppercase mb-1">
              Default Footer Return Note
            </label>
            <input
              type="text"
              value={formData.footerNote}
              onChange={(e) => handleChange('footerNote', e.target.value)}
              className="w-full px-3 py-1.5 border border-neutral-300 rounded font-semibold focus:border-black focus:outline-none"
              placeholder="Only Agra Item Will Be Return..."
            />
          </div>

          {/* Default Windows Printer */}
          <div>
            <label className="block font-bold text-neutral-700 uppercase mb-1">
              Default Windows Printer (Optional)
            </label>
            <input
              type="text"
              value={formData.defaultPrinter || ''}
              onChange={(e) => handleChange('defaultPrinter', e.target.value)}
              className="w-full px-3 py-1.5 border border-neutral-300 rounded text-neutral-700 focus:border-black focus:outline-none"
              placeholder="Leave blank to use Windows default dialog"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-1 px-3 py-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded border border-neutral-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-neutral-700 hover:bg-neutral-100 rounded border border-neutral-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1 px-4 py-1.5 bg-black hover:bg-neutral-800 text-white rounded font-bold shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
