import React, { useEffect, useState } from 'react';
import { Bill, BillCalculations, BillItem, BillType } from '../types';
import { calculateBill } from '../utils/billCalculator';
import { evaluateExpression, formatSmartNumber } from '../utils/mathParser';
import { Trash2 } from 'lucide-react';

interface PhysicalBillProps {
  bill: Bill;
  onUpdateBill: (updatedBill: Bill) => void;
  onDeleteItemRow: (itemId: string) => void;
  finePrecision: number;
  isPrintView?: boolean;
}

export const PhysicalBill: React.FC<PhysicalBillProps> = ({
  bill,
  onUpdateBill,
  onDeleteItemRow,
  finePrecision,
  isPrintView = false,
}) => {
  const [calculations, setCalculations] = useState<BillCalculations>(() =>
    calculateBill(bill, finePrecision)
  );

  // Live recalculations whenever bill data or precision changes
  useEffect(() => {
    setCalculations(calculateBill(bill, finePrecision));
  }, [bill, finePrecision]);

  // Live time updater if bill was just created and not manually frozen
  const [liveTime, setLiveTime] = useState(bill.time);
  const [liveDate, setLiveDate] = useState(bill.date);

  useEffect(() => {
    // Only update if bill is newly created (less than 2 minutes old)
    if (Date.now() - bill.createdAt < 120000 && !isPrintView) {
      const timer = setInterval(() => {
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dStr = `${now.getDate()}-${months[now.getMonth()]}-${now.getFullYear()}`;
        let h = now.getHours();
        const m = now.getMinutes();
        const ampm = h >= 12 ? 'pm' : 'am';
        h = h % 12 || 12;
        const mStr = m < 10 ? '0' + m : m;
        const tStr = `${h}:${mStr} ${ampm}`;
        setLiveTime(tStr);
        setLiveDate(dStr);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [bill.createdAt, isPrintView]);

  const handleFieldChange = (field: keyof Bill, value: any) => {
    onUpdateBill({
      ...bill,
      [field]: value,
    });
  };

  const handleItemChange = (index: number, field: keyof BillItem, value: string) => {
    const updatedItems = [...bill.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    onUpdateBill({
      ...bill,
      items: updatedItems,
    });
  };

  const toggleBillType = () => {
    const nextType: BillType =
      bill.billType === 'ROUGH ESTIMATE' ? 'FINAL BILL' : 'ROUGH ESTIMATE';
    handleFieldChange('billType', nextType);
  };

  return (
    <div
      id="printable-bill-container"
      className={`bg-white text-black font-sans mx-auto transition-all ${
        isPrintView
          ? 'w-full max-w-[210mm] p-4 text-[13px]'
          : 'w-full max-w-[850px] p-6 shadow-sm border border-neutral-300 rounded-sm text-[14px]'
      }`}
      style={{
        boxSizing: 'border-box',
        color: '#000',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif",
      }}
    >
      {/* BILL HEADER (Matches physical bill reference) */}
      <header
        id="bill-header"
        className="border-b-2 border-black pb-2 mb-2 select-none"
      >
        <div className="flex justify-between items-start">
          {/* Top Left: SL. NO. */}
          <div className="flex items-center space-x-1 font-bold text-[14px]">
            <span className="tracking-wide">SL. NO. -</span>
            {isPrintView ? (
              <span className="font-bold underline px-1">{bill.slNo || '1'}</span>
            ) : (
              <input
                id="header-slno-input"
                type="text"
                value={bill.slNo}
                onChange={(e) => handleFieldChange('slNo', e.target.value)}
                className="w-16 font-bold border-b border-dashed border-neutral-400 focus:border-black focus:outline-none px-1 text-black bg-transparent"
                title="Serial Number (Editable)"
              />
            )}
          </div>

          {/* Center: Bill Type & Shop Name */}
          <div className="text-center flex-1 px-4">
            <div
              id="header-bill-type"
              onClick={isPrintView ? undefined : toggleBillType}
              className={`font-extrabold tracking-widest text-[13px] uppercase cursor-pointer select-none inline-block px-2 py-0.5 ${
                !isPrintView ? 'hover:bg-neutral-100 rounded transition-colors' : ''
              }`}
              title={!isPrintView ? 'Click to toggle ROUGH ESTIMATE / FINAL BILL' : ''}
            >
              &lt;&lt; {bill.billType} &gt;&gt;
            </div>
            <div className="mt-0.5">
              {isPrintView ? (
                <h1 className="text-[20px] font-black uppercase tracking-wider text-black">
                  {bill.shopName || 'SHAMBHU JI RXL'}
                </h1>
              ) : (
                <input
                  id="header-shop-name-input"
                  type="text"
                  value={bill.shopName}
                  onChange={(e) => handleFieldChange('shopName', e.target.value)}
                  className="text-[20px] font-black uppercase tracking-wider text-center w-full focus:outline-none focus:bg-neutral-50 px-1 border-b border-transparent focus:border-black"
                  placeholder="SHAMBHU JI RXL"
                />
              )}
            </div>
          </div>

          {/* Top Right: Date & Time */}
          <div className="text-right font-medium text-[13px] leading-snug">
            <div id="header-bill-time" className="font-semibold">
              {isPrintView ? (
                bill.time || liveTime
              ) : (
                <input
                  type="text"
                  value={bill.time || liveTime}
                  onChange={(e) => handleFieldChange('time', e.target.value)}
                  className="w-24 text-right border-b border-dashed border-neutral-300 focus:border-black focus:outline-none px-1 bg-transparent"
                  title="Bill Time (Editable)"
                />
              )}
            </div>
            <div id="header-bill-date" className="font-semibold text-neutral-900 mt-0.5">
              {isPrintView ? (
                bill.date || liveDate
              ) : (
                <input
                  type="text"
                  value={bill.date || liveDate}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  className="w-28 text-right border-b border-dashed border-neutral-300 focus:border-black focus:outline-none px-1 bg-transparent"
                  title="Bill Date (Editable)"
                />
              )}
            </div>
          </div>
        </div>

        {/* Customer / Party row (Compact, preserved cleanly) */}
        <div className="mt-2 flex items-center text-[13px] border-t border-dotted border-neutral-300 pt-1">
          <span className="font-bold mr-2 text-neutral-800">Customer / Party:</span>
          {isPrintView ? (
            <span className="font-semibold uppercase flex-1">
              {bill.customer || '—'}
            </span>
          ) : (
            <input
              id="customer-party-input"
              type="text"
              value={bill.customer}
              onChange={(e) => handleFieldChange('customer', e.target.value)}
              placeholder="Enter Customer Name / Party (Optional)"
              className="flex-1 font-semibold focus:outline-none border-b border-neutral-300 focus:border-black px-1.5 py-0.5 bg-transparent"
            />
          )}
        </div>
      </header>

      {/* MAIN BILL TABLE */}
      <div className="w-full overflow-x-auto">
        <table
          id="main-bill-table"
          className="w-full border-collapse border border-black text-black"
          style={{ borderSpacing: 0 }}
        >
          <thead>
            <tr className="border-b-2 border-black bg-neutral-100/60 font-bold text-[13px]">
              <th className="border-r border-black px-1.5 py-1 text-right w-[11%]">Amount</th>
              <th className="border-r border-black px-2 py-1 text-left w-[29%]">Item</th>
              <th className="border-r border-black px-1.5 py-1 text-right w-[11%]">Weight</th>
              <th className="border-r border-black px-1.5 py-1 text-right w-[14%]">Less</th>
              <th className="border-r border-black px-1.5 py-1 text-right w-[11%]">Net Wt.</th>
              <th className="border-r border-black px-1.5 py-1 text-right w-[7%]">Tunch</th>
              <th className="border-r border-black px-1.5 py-1 text-right w-[7%]">Lab.</th>
              <th className="border-r border-black px-1.5 py-1 text-right w-[10%]">Fine</th>
              {!isPrintView && (
                <th className="no-print px-1 py-1 text-center w-[28px] text-neutral-400 font-normal">
                  Act
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {bill.items.map((item, index) => {
              const res = calculations.rowResults[index] || {
                amountVal: null,
                weightVal: null,
                lessVal: null,
                netWtVal: null,
                tunchVal: null,
                fineVal: null,
              };

              // Preview for less expression (e.g. 71*1.8 => = 127.8)
              const hasLessExpression =
                item.less && /[+*x×/÷\-]/.test(item.less) && res.lessVal !== null;
              const hasWeightExpression =
                item.weight && /[+*x×/÷\-]/.test(item.weight) && res.weightVal !== null;

              return (
                <tr
                  key={item.id || index}
                  className="border-b border-black text-[13px] hover:bg-neutral-50/50 transition-colors"
                >
                  {/* 1. Amount */}
                  <td className="border-r border-black px-1.5 py-0.5 text-right font-mono align-top">
                    {isPrintView ? (
                      item.amount || ''
                    ) : (
                      <input
                        type="text"
                        value={item.amount}
                        onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                        className="w-full text-right font-mono focus:outline-none focus:bg-neutral-100 px-0.5"
                        placeholder=""
                      />
                    )}
                  </td>

                  {/* 2. Item */}
                  <td className="border-r border-black px-2 py-0.5 text-left font-semibold align-top">
                    {isPrintView ? (
                      item.item || ''
                    ) : (
                      <input
                        type="text"
                        value={item.item}
                        onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                        className="w-full text-left font-medium focus:outline-none focus:bg-neutral-100 px-0.5 uppercase"
                        placeholder=""
                      />
                    )}
                  </td>

                  {/* 3. Weight */}
                  <td className="border-r border-black px-1.5 py-0.5 text-right font-mono align-top">
                    {isPrintView ? (
                      item.weight || ''
                    ) : (
                      <div>
                        <input
                          type="text"
                          value={item.weight}
                          onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                          className="w-full text-right font-mono focus:outline-none focus:bg-neutral-100 px-0.5"
                          placeholder=""
                        />
                        {hasWeightExpression && (
                          <div className="no-print text-[10px] text-neutral-500 font-sans text-right leading-none">
                            = {formatSmartNumber(res.weightVal!)}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* 4. Less */}
                  <td className="border-r border-black px-1.5 py-0.5 text-right font-mono align-top">
                    {isPrintView ? (
                      item.less || ''
                    ) : (
                      <div>
                        <input
                          type="text"
                          value={item.less}
                          onChange={(e) => handleItemChange(index, 'less', e.target.value)}
                          className="w-full text-right font-mono focus:outline-none focus:bg-neutral-100 px-0.5"
                          placeholder=""
                        />
                        {hasLessExpression && (
                          <div className="no-print text-[10px] text-neutral-500 font-sans text-right leading-none">
                            = {formatSmartNumber(res.lessVal!)}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* 5. Net Wt. (LOCKED / AUTOMATIC) */}
                  <td className="border-r border-black px-1.5 py-0.5 text-right font-mono font-bold align-top bg-neutral-50/30">
                    {res.netWtVal !== null ? formatSmartNumber(res.netWtVal) : ''}
                  </td>

                  {/* 6. Tunch */}
                  <td className="border-r border-black px-1.5 py-0.5 text-right font-mono align-top">
                    {isPrintView ? (
                      item.tunch || ''
                    ) : (
                      <input
                        type="text"
                        value={item.tunch}
                        onChange={(e) => handleItemChange(index, 'tunch', e.target.value)}
                        className="w-full text-right font-mono focus:outline-none focus:bg-neutral-100 px-0.5"
                        placeholder=""
                      />
                    )}
                  </td>

                  {/* 7. Lab. */}
                  <td className="border-r border-black px-1.5 py-0.5 text-right font-mono align-top">
                    {isPrintView ? (
                      item.lab || ''
                    ) : (
                      <input
                        type="text"
                        value={item.lab}
                        onChange={(e) => handleItemChange(index, 'lab', e.target.value)}
                        className="w-full text-right font-mono focus:outline-none focus:bg-neutral-100 px-0.5"
                        placeholder=""
                      />
                    )}
                  </td>

                  {/* 8. Fine (LOCKED / AUTOMATIC) */}
                  <td className="border-r border-black px-1.5 py-0.5 text-right font-mono font-bold align-top bg-neutral-50/30">
                    {res.fineVal !== null ? formatSmartNumber(res.fineVal, finePrecision) : ''}
                  </td>

                  {/* UI Action: Delete Row */}
                  {!isPrintView && (
                    <td className="no-print px-1 py-0.5 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => onDeleteItemRow(item.id)}
                        className="text-neutral-400 hover:text-red-600 p-0.5 rounded transition-colors"
                        title="Delete Row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}

            {/* SUMMARY ROW 1: New Total (AUTOMATIC) */}
            <tr id="row-new-total" className="border-b border-black font-bold text-[13px] bg-neutral-100/40">
              <td className="border-r border-black px-1.5 py-1 text-right font-mono">
                {calculations.newTotalAmount > 0
                  ? formatSmartNumber(calculations.newTotalAmount)
                  : ''}
              </td>
              <td className="border-r border-black px-2 py-1 text-left font-bold uppercase">
                New Total
              </td>
              <td className="border-r border-black px-1.5 py-1 text-right font-mono">
                {calculations.newTotalWeight > 0
                  ? formatSmartNumber(calculations.newTotalWeight)
                  : ''}
              </td>
              <td className="border-r border-black px-1.5 py-1 text-right font-mono">
                {calculations.newTotalLess > 0
                  ? formatSmartNumber(calculations.newTotalLess)
                  : ''}
              </td>
              <td className="border-r border-black px-1.5 py-1 text-right font-mono">
                {calculations.newTotalNet > 0
                  ? formatSmartNumber(calculations.newTotalNet)
                  : ''}
              </td>
              <td className="border-r border-black px-1.5 py-1 text-right font-mono"></td>
              <td className="border-r border-black px-1.5 py-1 text-right font-mono"></td>
              <td className="border-r border-black px-1.5 py-1 text-right font-mono font-bold">
                {calculations.newTotalFine > 0
                  ? formatSmartNumber(calculations.newTotalFine, finePrecision)
                  : ''}
              </td>
              {!isPrintView && <td className="no-print"></td>}
            </tr>

            {/* SUMMARY ROW 2: Old Balance (Freely Editable Label, Amount, Date, Fine) */}
            <tr id="row-old-balance" className="border-b border-black text-[13px]">
              {/* Amount */}
              <td className="border-r border-black px-1.5 py-1 text-right font-mono font-semibold">
                {isPrintView ? (
                  bill.oldBalanceAmount || ''
                ) : (
                  <input
                    type="text"
                    value={bill.oldBalanceAmount}
                    onChange={(e) => handleFieldChange('oldBalanceAmount', e.target.value)}
                    className="w-full text-right font-mono font-semibold focus:outline-none focus:bg-neutral-100 px-0.5"
                    placeholder=""
                  />
                )}
              </td>

              {/* Label & Date */}
              <td className="border-r border-black px-2 py-1 text-left">
                <div className="flex items-center space-x-2">
                  {isPrintView ? (
                    <span className="font-bold">{bill.oldBalanceLabel || 'Old Balance'}</span>
                  ) : (
                    <input
                      type="text"
                      value={bill.oldBalanceLabel}
                      onChange={(e) => handleFieldChange('oldBalanceLabel', e.target.value)}
                      className="font-bold w-28 focus:outline-none focus:bg-neutral-100 px-0.5"
                      placeholder="Old Balance"
                    />
                  )}
                  <span className="text-neutral-500 font-mono text-[12px] font-normal">
                    {isPrintView ? (
                      bill.oldBalanceDate || ''
                    ) : (
                      <input
                        type="text"
                        value={bill.oldBalanceDate}
                        onChange={(e) => handleFieldChange('oldBalanceDate', e.target.value)}
                        className="w-24 text-left font-mono text-neutral-600 focus:outline-none focus:bg-neutral-100 px-0.5 text-[12px]"
                        placeholder="e.g. 15-Apr-2026"
                      />
                    )}
                  </span>
                </div>
              </td>

              {/* Empty columns matching physical bill */}
              <td className="border-r border-black px-1.5 py-1"></td>
              <td className="border-r border-black px-1.5 py-1"></td>
              <td className="border-r border-black px-1.5 py-1"></td>
              <td className="border-r border-black px-1.5 py-1"></td>
              <td className="border-r border-black px-1.5 py-1"></td>

              {/* Old Balance Fine */}
              <td className="border-r border-black px-1.5 py-1 text-right font-mono font-semibold">
                {isPrintView ? (
                  bill.oldBalanceFine || ''
                ) : (
                  <input
                    type="text"
                    value={bill.oldBalanceFine}
                    onChange={(e) => handleFieldChange('oldBalanceFine', e.target.value)}
                    className="w-full text-right font-mono font-semibold focus:outline-none focus:bg-neutral-100 px-0.5"
                    placeholder=""
                  />
                )}
              </td>
              {!isPrintView && <td className="no-print"></td>}
            </tr>

            {/* SUMMARY ROW 3: Total (LOCKED & AUTOMATIC) */}
            <tr id="row-total" className="border-b border-black font-bold text-[13px] bg-neutral-100/30">
              <td className="border-r border-black px-1.5 py-1 text-right font-mono">
                {calculations.totalAmount > 0
                  ? formatSmartNumber(calculations.totalAmount)
                  : ''}
              </td>
              <td className="border-r border-black px-2 py-1 text-left font-bold uppercase">
                Total
              </td>
              <td className="border-r border-black px-1.5 py-1"></td>
              <td className="border-r border-black px-1.5 py-1"></td>
              <td className="border-r border-black px-1.5 py-1"></td>
              <td className="border-r border-black px-1.5 py-1"></td>
              <td className="border-r border-black px-1.5 py-1"></td>
              <td className="border-r border-black px-1.5 py-1 text-right font-mono font-bold">
                {calculations.totalFine > 0
                  ? formatSmartNumber(calculations.totalFine, finePrecision)
                  : ''}
              </td>
              {!isPrintView && <td className="no-print"></td>}
            </tr>

            {/* SUMMARY ROW 4: Jama Total (Freely Editable Label, Amount, Fine) */}
            <tr id="row-jama-total" className="border-b border-black text-[13px]">
              {/* Jama Amount */}
              <td className="border-r border-black px-1.5 py-1 text-right font-mono font-semibold">
                {isPrintView ? (
                  bill.jamaAmount || ''
                ) : (
                  <input
                    type="text"
                    value={bill.jamaAmount}
                    onChange={(e) => handleFieldChange('jamaAmount', e.target.value)}
                    className="w-full text-right font-mono font-semibold focus:outline-none focus:bg-neutral-100 px-0.5"
                    placeholder=""
                  />
                )}
              </td>

              {/* Jama Label */}
              <td className="border-r border-black px-2 py-1 text-left font-bold">
                {isPrintView ? (
                  bill.jamaLabel || 'Jama Total'
                ) : (
                  <input
                    type="text"
                    value={bill.jamaLabel}
                    onChange={(e) => handleFieldChange('jamaLabel', e.target.value)}
                    className="font-bold w-full focus:outline-none focus:bg-neutral-100 px-0.5"
                    placeholder="Jama Total"
                  />
                )}
              </td>

              {/* Empty columns */}
              <td className="border-r border-black px-1.5 py-1"></td>
              <td className="border-r border-black px-1.5 py-1"></td>
              <td className="border-r border-black px-1.5 py-1"></td>
              <td className="border-r border-black px-1.5 py-1"></td>
              <td className="border-r border-black px-1.5 py-1"></td>

              {/* Jama Fine */}
              <td className="border-r border-black px-1.5 py-1 text-right font-mono font-semibold">
                {isPrintView ? (
                  bill.jamaFine || ''
                ) : (
                  <input
                    type="text"
                    value={bill.jamaFine}
                    onChange={(e) => handleFieldChange('jamaFine', e.target.value)}
                    className="w-full text-right font-mono font-semibold focus:outline-none focus:bg-neutral-100 px-0.5"
                    placeholder=""
                  />
                )}
              </td>
              {!isPrintView && <td className="no-print"></td>}
            </tr>

            {/* SUMMARY ROW 5: (BAKI) Final ... (BAKI) (LOCKED & AUTOMATIC) */}
            <tr
              id="row-final-baki"
              className="border-b-2 border-black font-extrabold text-[14px] bg-neutral-100/70"
            >
              <td className="border-r border-black px-1.5 py-1.5 text-right font-mono">
                {calculations.finalAmount !== 0
                  ? formatSmartNumber(calculations.finalAmount)
                  : calculations.totalAmount > 0
                  ? '0'
                  : ''}
              </td>
              <td className="border-r border-black px-2 py-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold tracking-wide text-[13px]">(BAKI)</span>
                  <span className="font-black text-[14px] uppercase">Final</span>
                  <span className="font-extrabold tracking-wide text-[13px]">(BAKI)</span>
                </div>
              </td>
              <td className="border-r border-black px-1.5 py-1.5"></td>
              <td className="border-r border-black px-1.5 py-1.5"></td>
              <td className="border-r border-black px-1.5 py-1.5"></td>
              <td className="border-r border-black px-1.5 py-1.5"></td>
              <td className="border-r border-black px-1.5 py-1.5"></td>
              <td className="border-r border-black px-1.5 py-1.5 text-right font-mono font-black text-[14px]">
                {calculations.finalFine !== 0
                  ? formatSmartNumber(calculations.finalFine, finePrecision)
                  : calculations.totalFine > 0
                  ? '0'
                  : ''}
              </td>
              {!isPrintView && <td className="no-print"></td>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* FOOTER SECTION (Matches physical bill) */}
      <footer id="bill-footer" className="mt-4 pt-2 select-none">
        <div className="flex justify-between items-center text-[13px]">
          {/* Footer note: Only Agra Item Will Be Return... */}
          <div className="font-bold italic tracking-wide text-neutral-800">
            {isPrintView ? (
              bill.footerNote || 'Only Agra Item Will Be Return...'
            ) : (
              <input
                type="text"
                value={bill.footerNote}
                onChange={(e) => handleFieldChange('footerNote', e.target.value)}
                className="font-bold italic text-neutral-800 w-80 focus:outline-none border-b border-dashed border-neutral-300 focus:border-black bg-transparent"
                placeholder="Only Agra Item Will Be Return..."
              />
            )}
          </div>

          {/* Dhada box */}
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[14px]">Dhada.</span>
            {isPrintView ? (
              <div className="border border-black px-3 py-1 font-mono font-bold min-w-[70px] text-center">
                {bill.dhada || ' '}
              </div>
            ) : (
              <input
                type="text"
                value={bill.dhada}
                onChange={(e) => handleFieldChange('dhada', e.target.value)}
                placeholder="[  ]"
                className="border border-black px-2 py-0.5 w-24 text-center font-mono font-bold focus:outline-none focus:bg-neutral-50"
              />
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
