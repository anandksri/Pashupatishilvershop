import { useEffect, useState, useCallback, useRef } from 'react';
import { Bill, AppSettings } from './types';
import {
  createEmptyBill,
  createEmptyBillItem,
} from './utils/billCalculator';
import { StorageService, DEFAULT_SETTINGS } from './services/storage';
import { PhysicalBill } from './components/PhysicalBill';
import { BillHistoryModal } from './components/BillHistoryModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { SettingsModal } from './components/SettingsModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import {
  Plus,
  PlusCircle,
  Save,
  Printer,
  Eye,
  History,
  Settings as SettingsIcon,
  Cloud,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [bills, setBills] = useState<Bill[]>([]);
  const [currentBill, setCurrentBill] = useState<Bill>(() =>
    createEmptyBill('7', DEFAULT_SETTINGS.shopName, DEFAULT_SETTINGS.defaultBillType)
  );

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Notification toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [captureBill, setCaptureBill] = useState<Bill | null>(null);
  const captureResolver = useRef<((imageDataUrl?: string) => void) | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const capturePrintBill = (bill: Bill): Promise<string | undefined> => {
    if (!(window as any).electronAPI?.captureBillImage) return Promise.resolve(undefined);

    return new Promise((resolve) => {
      captureResolver.current = resolve;
      setCaptureBill(bill);
    });
  };

  useEffect(() => {
    if (!captureBill) return;

    const frame = requestAnimationFrame(async () => {
      try {
        const element = document.getElementById('drive-capture-bill');
        if (!element) throw new Error('Print-view bill was not rendered.');
        const rect = element.getBoundingClientRect();
        const imageDataUrl = await (window as any).electronAPI.captureBillImage({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        });
        captureResolver.current?.(imageDataUrl);
      } catch (error) {
        console.error('Failed to capture print-view bill:', error);
        captureResolver.current?.(undefined);
      } finally {
        captureResolver.current = null;
        setCaptureBill(null);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [captureBill]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const loadedSettings = await StorageService.getSettings();
        setSettings(loadedSettings);

        const loadedBills = await StorageService.getBills();
        setBills(loadedBills);

        // Determine next SL number
        const nextSerial = await StorageService.getNextSerial();
        setCurrentBill(createEmptyBill(
          nextSerial,
          loadedSettings.shopName,
          loadedSettings.defaultBillType,
          loadedSettings.footerNote
        ));
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };

    loadInitialData();
  }, []);

  // Keyboard shortcuts (Ctrl+S, Ctrl+P, Ctrl+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        showToast('Saving is temporarily disabled.', 'info');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewBill();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentBill, settings]);

  // Add 1 blank item row
  const handleAddItem = () => {
    setCurrentBill((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyBillItem()],
    }));
  };

  // Add 5 blank item rows
  const handleAdd5Items = () => {
    const newItems = Array.from({ length: 5 }, () => createEmptyBillItem());
    setCurrentBill((prev) => ({
      ...prev,
      items: [...prev.items, ...newItems],
    }));
  };

  // Delete row (if last row, leave 1 blank row)
  const handleDeleteItemRow = (itemId: string) => {
    setCurrentBill((prev) => {
      const filtered = prev.items.filter((item) => item.id !== itemId);
      if (filtered.length === 0) {
        return {
          ...prev,
          items: [createEmptyBillItem()],
        };
      }
      return {
        ...prev,
        items: filtered,
      };
    });
  };

  // Save current bill
  const handleSaveBill = async () => {
    showToast('Saving is temporarily disabled.', 'info');
  };

  // Create new bill
  const handleNewBill = async () => {
    const nextSerial = await StorageService.getNextSerial();
    setCurrentBill(
      createEmptyBill(
        nextSerial,
        settings.shopName,
        settings.defaultBillType,
        settings.footerNote
      )
    );
    showToast(`New bill initialized (SL. NO. ${nextSerial}). All fields blank.`, 'info');
  };

  // Print Bill
  const handlePrint = useCallback(() => {
    if (typeof window !== 'undefined') {
      const isElectron = (window as any).electronAPI !== undefined;
      if (isElectron) {
        (window as any).electronAPI
          .printBill({ silent: false })
          .then((res: any) => {
            if (res && res.cancelled) {
              showToast('Printing cancelled.', 'info');
            } else {
              showToast('Bill sent to Windows printer.', 'success');
            }
          })
          .catch((err: any) => {
            console.error('Electron print error, falling back to browser print:', err);
            window.print();
          });
      } else {
        window.print();
      }
    }
  }, []);

  // Load saved bill into editor
  const handleEditSavedBill = (bill: Bill) => {
    setCurrentBill(bill);
    setIsHistoryOpen(false);
    showToast(`Loaded Bill SL. NO. ${bill.slNo} (${bill.customer || 'No Customer'})`, 'info');
  };

  // View saved bill in print preview
  const handleViewSavedBill = (bill: Bill) => {
    setCurrentBill(bill);
    setIsHistoryOpen(false);
    setIsPrintPreviewOpen(true);
  };

  // Delete saved bill
  const handleDeleteSavedBill = async (id: string) => {
    const ok = await StorageService.deleteBill(id);
    if (ok) {
      showToast('Bill deleted from database.', 'info');
      const updated = await StorageService.getBills();
      setBills(updated);
    } else {
      showToast('Unable to delete bill.', 'error');
    }
  };

  // Save Settings
  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await StorageService.saveSettings(newSettings);
    showToast('Settings saved successfully.', 'success');
  };

  // Load Reference Test Case (Section 31 verification)
  const handleLoadTestCase = () => {
    const testBill: Bill = {
      ...createEmptyBill('7', settings.shopName, 'ROUGH ESTIMATE', settings.footerNote),
      date: '18-May-2026',
      time: '7:04 pm',
      customer: 'TEST CASE (SECTION 31)',
      items: [
        {
          id: 't1',
          amount: '6290',
          item: 'MICRO FX HAAR',
          weight: '565',
          less: '10*12.140+6*12.315',
          tunch: '74',
          lab: '17000',
        },
        {
          id: 't2',
          amount: '4500',
          item: 'OPB',
          weight: '1040',
          less: '71*1.8',
          tunch: '61',
          lab: '',
        },
        {
          id: 't3',
          amount: '3800',
          item: 'RP KADA',
          weight: '956',
          less: '14*1.8+19*1.8',
          tunch: '62',
          lab: '',
        },
        {
          id: 't4',
          amount: '7500',
          item: 'BMB PAYAL 45',
          weight: '1660',
          less: '25*1.410+1*9.180+15*1.980',
          tunch: '38',
          lab: '',
        },
      ],
      oldBalanceLabel: 'Old Balance',
      oldBalanceAmount: '20155',
      oldBalanceDate: '15-Apr-2026',
      oldBalanceFine: '2967',
      jamaLabel: 'Jama Total',
      jamaAmount: '',
      jamaFine: '',
      dhada: '12.45',
    };
    setCurrentBill(testBill);
    showToast('Loaded Section 31 test case expressions successfully.', 'info');
  };

  return (
    <div className="min-h-screen bg-neutral-200 text-neutral-900 flex flex-col selection:bg-neutral-300">
      {/* APP COMMAND BAR (Top Desktop Toolbar, Hidden on Print) */}
      <header
        id="app-command-bar"
        className="no-print sticky top-0 z-40 bg-neutral-900 text-white shadow-md border-b border-neutral-800"
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* Left: App Identity */}
          <div className="flex items-center space-x-3">
            <div className="bg-white text-black p-1.5 rounded font-black text-xs tracking-wider uppercase">
              RXL
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wide flex items-center space-x-2">
                <span>{currentBill.shopName || 'SHAMBHU JI RXL'}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Windows Desktop
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 font-mono">
                Bill SL. NO. {currentBill.slNo} &bull; {currentBill.billType}
              </div>
            </div>
          </div>

          {/* Center: Core Billing Actions */}
          <div className="flex items-center space-x-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 rounded text-xs font-bold transition-colors border border-neutral-700"
              title="Add 1 blank item row"
            >
              <Plus className="w-3.5 h-3.5 text-green-400" />
              <span>+ Add Item</span>
            </button>

            <button
              type="button"
              onClick={handleAdd5Items}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 rounded text-xs font-bold transition-colors border border-neutral-700"
              title="Add 5 blank item rows"
            >
              <PlusCircle className="w-3.5 h-3.5 text-green-400" />
              <span>+ Add 5 Items</span>
            </button>

            <div className="h-5 w-px bg-neutral-700 mx-1" />

            <button
              type="button"
              onClick={handleNewBill}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 rounded text-xs font-bold transition-colors border border-neutral-700"
              title="Initialize a new blank bill (Ctrl+N)"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>New Bill</span>
            </button>

            <button
              type="button"
              onClick={handleSaveBill}
              disabled
              className="flex items-center space-x-1 px-3.5 py-1.5 bg-neutral-600 text-neutral-300 rounded text-xs font-black opacity-60 cursor-not-allowed"
              title="Saving is temporarily disabled"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Bill</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded text-xs font-black transition-colors shadow-xs text-white"
              title="Print bill on Windows printer (Ctrl+P)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintPreviewOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-bold transition-colors border border-neutral-700 text-neutral-200"
              title="Preview exact A4 printed bill"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print Preview</span>
            </button>
          </div>

          {/* Right: Modals & Archive */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-bold transition-colors border border-neutral-700 relative"
              title="View all saved bills"
            >
              <History className="w-3.5 h-3.5 text-yellow-400" />
              <span>History</span>
              {bills.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-neutral-700 text-white text-[10px] rounded-full font-mono">
                  {bills.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsDriveModalOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-bold transition-colors border border-neutral-700 text-neutral-300"
              title="Backup & Restore architecture"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Backup</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors border border-neutral-700"
              title="Settings (Shop Name, Rounding, Printer)"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* QUICK HELPER & STATUS BAR (Non-printing) */}
      <div
        id="test-presets-bar"
        className="no-print bg-neutral-100 border-b border-neutral-300 px-4 py-1.5 text-xs flex flex-wrap justify-between items-center gap-2"
      >
        <div className="flex items-center space-x-3 text-neutral-600">
          <span className="font-semibold text-neutral-800">Direct Expressions:</span>
          <span>e.g. <code>10*12.140+6*12.315</code>, <code>71*1.8</code>, <code>25*1.410+1*9.180+15*1.980</code></span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleLoadTestCase}
            className="flex items-center space-x-1 px-2 py-0.5 bg-white hover:bg-neutral-200 rounded border border-neutral-300 text-neutral-800 font-semibold text-[11px] transition-colors"
            title="Load Section 31 reference test case with arithmetic expressions"
          >
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>Load Reference Test Bill</span>
          </button>
          <button
            type="button"
            onClick={handleNewBill}
            className="flex items-center space-x-1 px-2 py-0.5 bg-white hover:bg-neutral-200 rounded border border-neutral-300 text-neutral-800 font-semibold text-[11px] transition-colors"
            title="Reset to clean blank bill"
          >
            <RotateCcw className="w-3 h-3 text-neutral-600" />
            <span>Clear to Blank</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {toast && (
        <div
          id="notification-toast"
          className={`no-print fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded shadow-xl border flex items-center space-x-2 text-xs font-bold transition-all transform translate-y-0 ${
            toast.type === 'error'
              ? 'bg-red-900 text-white border-red-700'
              : toast.type === 'info'
              ? 'bg-neutral-900 text-white border-neutral-700'
              : 'bg-green-800 text-white border-green-600'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-300" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* MAIN BILL CANVAS (The Physical Bill is the Master Centerpiece) */}
      <main className="flex-1 py-8 px-4 flex justify-center items-start overflow-y-auto">
        <PhysicalBill
          bill={currentBill}
          onUpdateBill={setCurrentBill}
          onDeleteItemRow={handleDeleteItemRow}
          finePrecision={settings.finePrecision}
          isPrintView={false}
        />
      </main>

      {captureBill && (
        <div
          id="drive-capture-bill"
          className="fixed left-0 top-0 z-[100] bg-white"
          style={{ width: '794px' }}
        >
          <PhysicalBill
            bill={captureBill}
            onUpdateBill={() => {}}
            onDeleteItemRow={() => {}}
            finePrecision={settings.finePrecision}
            isPrintView={true}
          />
        </div>
      )}

      {/* MODALS */}
      <BillHistoryModal
        bills={bills}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onEditBill={handleEditSavedBill}
        onViewBill={handleViewSavedBill}
        onDeleteBill={handleDeleteSavedBill}
        onPrintBill={(b) => {
          setCurrentBill(b);
          setTimeout(() => handlePrint(), 100);
        }}
      />

      <PrintPreviewModal
        bill={currentBill}
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        onPrint={handlePrint}
        finePrecision={settings.finePrecision}
      />

      <SettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onDataRestored={async () => {
          const reloaded = await StorageService.getBills();
          setBills(reloaded);
          if (reloaded.length > 0) {
            setCurrentBill(reloaded[0]);
          }
        }}
      />
    </div>
  );
}
