import React, { useState } from 'react';
import { Bill } from '../types';
import { calculateBill } from '../utils/billCalculator';
import { formatSmartNumber } from '../utils/mathParser';
import { Search, Edit3, Trash2, Printer, X, Eye } from 'lucide-react';

interface BillHistoryModalProps {
  bills: Bill[];
  isOpen: boolean;
  onClose: () => void;
  onEditBill: (bill: Bill) => void;
  onViewBill: (bill: Bill) => void;
  onDeleteBill: (id: string) => void;
  onPrintBill: (bill: Bill) => void;
}

export const BillHistoryModal: React.FC<BillHistoryModalProps> = ({
  bills,
  isOpen,
  onClose,
  onEditBill,
  onViewBill,
  onDeleteBill,
  onPrintBill,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredBills = bills.filter((b) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (b.customer && b.customer.toLowerCase().includes(q)) ||
      (b.slNo && b.slNo.toLowerCase().includes(q)) ||
      (b.date && b.date.toLowerCase().includes(q)) ||
      (b.id && b.id.toLowerCase().includes(q)) ||
      (b.shopName && b.shopName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-neutral-300">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div>
            <h2 className="text-lg font-black tracking-wide text-neutral-900 uppercase">
              Bill History & Archives
            </h2>
            <p className="text-xs text-neutral-500">
              Total Saved Bills: {bills.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-200 rounded text-neutral-600 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Toolbar */}
        <div className="p-4 border-b border-neutral-200 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Customer / Party, SL Number, Date, or Bill ID..."
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-neutral-300 rounded focus:border-black focus:outline-none"
            />
          </div>
        </div>

        {/* Bills Table */}
        <div className="overflow-y-auto flex-1 p-4">
          {filteredBills.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <p className="text-sm font-medium">
                {searchTerm ? 'No matching bills found.' : 'No saved bills in database yet.'}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Save a bill from the main screen to see it here.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b-2 border-neutral-300 bg-neutral-100/70 text-neutral-700 font-bold uppercase">
                  <th className="py-2 px-3">SL No</th>
                  <th className="py-2 px-3">Date & Time</th>
                  <th className="py-2 px-3">Customer / Party</th>
                  <th className="py-2 px-3">Bill Type</th>
                  <th className="py-2 px-3 text-right">Items</th>
                  <th className="py-2 px-3 text-right">Final Amount</th>
                  <th className="py-2 px-3 text-right">Final Fine</th>
                  <th className="py-2 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-medium">
                {filteredBills.map((bill) => {
                  const calc = calculateBill(bill, 0);
                  return (
                    <tr
                      key={bill.id}
                      className="hover:bg-neutral-50 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-neutral-900 font-mono">
                        {bill.slNo || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-neutral-600">
                        {bill.date} <span className="text-[11px] text-neutral-400">{bill.time}</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-neutral-800 uppercase">
                        {bill.customer || <span className="text-neutral-400 font-normal">No Customer</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                            bill.billType === 'FINAL BILL'
                              ? 'bg-neutral-900 text-white'
                              : 'bg-neutral-200 text-neutral-800'
                          }`}
                        >
                          {bill.billType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                        {bill.items.length}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                        {calc.finalAmount !== 0 ? formatSmartNumber(calc.finalAmount) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                        {calc.finalFine !== 0 ? formatSmartNumber(calc.finalFine) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => onViewBill(bill)}
                            className="p-1 text-neutral-600 hover:text-black hover:bg-neutral-200 rounded transition-colors"
                            title="Preview / Print"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditBill(bill)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Bill"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onPrintBill(bill)}
                            className="p-1 text-green-700 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                            title="Direct Print"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete Bill SL. ${bill.slNo}?`)) {
                                onDeleteBill(bill.id);
                              }
                            }}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Delete Bill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
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
