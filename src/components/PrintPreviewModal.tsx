import React from 'react';
import { Bill } from '../types';
import { PhysicalBill } from './PhysicalBill';
import { Printer, X } from 'lucide-react';

interface PrintPreviewModalProps {
  bill: Bill;
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  finePrecision: number;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  bill,
  isOpen,
  onClose,
  onPrint,
  finePrecision,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-neutral-100 rounded shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-neutral-400">
        {/* Modal Toolbar */}
        <div className="flex justify-between items-center px-6 py-3 bg-neutral-900 text-white rounded-t">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm tracking-wider uppercase">
              Print Preview — A4 Physical Bill
            </span>
            <span className="text-xs text-neutral-400">
              (Exactly as sent to Windows Printer)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onPrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print to Windows Printer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bill Sheet Canvas */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-neutral-200">
          <div className="bg-white p-6 shadow-lg border border-neutral-400 w-full max-w-[820px]">
            <PhysicalBill
              bill={bill}
              onUpdateBill={() => {}}
              onDeleteItemRow={() => {}}
              finePrecision={finePrecision}
              isPrintView={true}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-2.5 bg-neutral-800 text-neutral-300 text-xs flex justify-between items-center rounded-b">
          <span>Action column, calculation previews, and editing borders are stripped automatically.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-white text-xs font-semibold"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
