import React, { useState, useMemo } from 'react';
import { SalesReport, Branch, FlavorInventoryItem } from '../types';
import {
  FileSpreadsheet,
  Search,
  Plus,
  RotateCcw,
  PenSquare,
  FileText,
  Calculator,
  Drumstick,
  Boxes,
  Receipt,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { computeSalesReport } from '../services/salesCalculator';
import { exportRowsToCSV } from '../services/exportCsv';

interface SalesTabProps {
  salesReports: SalesReport[];
  branches: Branch[];
  currentAdminEmail: string;
  onSaveSalesReport: (report: Partial<SalesReport>, key?: string) => Promise<void>;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const SalesTab: React.FC<SalesTabProps> = ({
  salesReports,
  branches,
  currentAdminEmail,
  onSaveSalesReport,
  showToast,
}) => {
  const [filterBranch, setFilterBranch] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Form Fields
  const todayStr = new Date().toISOString().split('T')[0];
  const [branchName, setBranchName] = useState('');
  const [salesDate, setSalesDate] = useState(todayStr);
  const [submittedBy, setSubmittedBy] = useState('');
  const [bagAyam, setBagAyam] = useState<number | string>(0);
  const [salesCash, setSalesCash] = useState<number | string>(0);
  const [catatan, setCatatan] = useState('');

  // Platforms
  const [misi, setMisi] = useState<number | string>(0);
  const [lalamove, setLalamove] = useState<number | string>(0);
  const [foodPanda, setFoodPanda] = useState<number | string>(0);
  const [grabFood, setGrabFood] = useState<number | string>(0);
  const [shopeeFood, setShopeeFood] = useState<number | string>(0);

  // Flavors state helper
  const createEmptyFlavor = (): FlavorInventoryItem => ({
    prevStock: 0,
    newStock: 0,
    promoFree: 0,
    balance: 0,
    sold: 0,
  });

  const [cheese, setCheese] = useState<FlavorInventoryItem>(createEmptyFlavor());
  const [korean, setKorean] = useState<FlavorInventoryItem>(createEmptyFlavor());
  const [garlic, setGarlic] = useState<FlavorInventoryItem>(createEmptyFlavor());
  const [furikake, setFurikake] = useState<FlavorInventoryItem>(createEmptyFlavor());
  const [togarashi, setTogarashi] = useState<FlavorInventoryItem>(createEmptyFlavor());
  const [coleslaw, setColeslaw] = useState<FlavorInventoryItem>(createEmptyFlavor());

  // Quality & Wastage
  const [promo10Pcs, setPromo10Pcs] = useState<number | string>(0);
  const [ayamTakHabis, setAyamTakHabis] = useState<number | string>(0);
  const [ayamBusuk, setAyamBusuk] = useState<number | string>(0);
  const [ayamShort, setAyamShort] = useState<number | string>(0);
  const [review, setReview] = useState<number | string>(0);
  const [loyalKad, setLoyalKad] = useState<number | string>(0);

  // Expenses
  const [minyakMasak, setMinyakMasak] = useState<number | string>(0);
  const [staffMeal, setStaffMeal] = useState<number | string>(0);
  const [gas, setGas] = useState<number | string>(0);
  const [ais, setAis] = useState<number | string>(0);
  const [beliBarang, setBeliBarang] = useState<number | string>(0);
  const [minyakKenderaan, setMinyakKenderaan] = useState<number | string>(0);
  const [dobi, setDobi] = useState<number | string>(0);

  const [isSaving, setIsSaving] = useState(false);

  // Real-time calculation object
  const currentCalc = useMemo(() => {
    return computeSalesReport({
      jumlahBag: bagAyam,
      salesCash: Number(salesCash) || 0,
      platforms: {
        misi: Number(misi) || 0,
        lalamove: Number(lalamove) || 0,
        foodPanda: Number(foodPanda) || 0,
        grabFood: Number(grabFood) || 0,
        shopeeFood: Number(shopeeFood) || 0,
      },
      inventoryTracker: {
        Cheese: cheese,
        Korean: korean,
        Garlic: garlic,
        Furikake: furikake,
        Togarashi: togarashi,
        Coleslaw: coleslaw,
      },
      qualityAndWastage: {
        promo10Pcs,
        ayamTakHabis,
        ayamBusuk,
        ayamShort,
        review,
        loyalKad,
      },
      expenses: {
        minyakMasak,
        staffMeal,
        gas: Number(gas) || 0,
        ais: Number(ais) || 0,
        beliBarang: Number(beliBarang) || 0,
        minyakKenderaan: Number(minyakKenderaan) || 0,
        dobi: Number(dobi) || 0,
      },
    });
  }, [
    bagAyam, salesCash, misi, lalamove, foodPanda, grabFood, shopeeFood,
    cheese, korean, garlic, furikake, togarashi, coleslaw,
    promo10Pcs, ayamTakHabis, ayamBusuk, ayamShort, review, loyalKad,
    minyakMasak, staffMeal, gas, ais, beliBarang, minyakKenderaan, dobi
  ]);

  const handleOpenAdd = () => {
    setEditingKey(null);
    setBranchName(branches.length > 0 ? branches[0].name : '');
    setSalesDate(todayStr);
    setSubmittedBy(currentAdminEmail || 'Admin');
    setBagAyam(0);
    setSalesCash(0);
    setCatatan('');
    setMisi(0);
    setLalamove(0);
    setFoodPanda(0);
    setGrabFood(0);
    setShopeeFood(0);

    setCheese(createEmptyFlavor());
    setKorean(createEmptyFlavor());
    setGarlic(createEmptyFlavor());
    setFurikake(createEmptyFlavor());
    setTogarashi(createEmptyFlavor());
    setColeslaw(createEmptyFlavor());

    setPromo10Pcs(0);
    setAyamTakHabis(0);
    setAyamBusuk(0);
    setAyamShort(0);
    setReview(0);
    setLoyalKad(0);

    setMinyakMasak(0);
    setStaffMeal(0);
    setGas(0);
    setAis(0);
    setBeliBarang(0);
    setMinyakKenderaan(0);
    setDobi(0);

    setIsModalOpen(true);
  };

  const handleOpenEdit = (report: SalesReport) => {
    setEditingKey(report.key);
    setBranchName(report.cawangan || report.branch || (branches[0]?.name || ''));
    setSalesDate(report.date || todayStr);
    setSubmittedBy(report.submittedBy || 'Staff');
    setBagAyam(report.jumlahBag ?? report.bagAyam ?? 0);
    setSalesCash(report.salesCash || 0);
    setCatatan(report.catatan || '');

    const plat = report.platforms || {};
    setMisi(plat.misi || 0);
    setLalamove(plat.lalamove || 0);
    setFoodPanda(plat.foodPanda || 0);
    setGrabFood(plat.grabFood || 0);
    setShopeeFood(plat.shopeeFood || 0);

    const inv = report.inventoryTracker || {};
    setCheese(inv.Cheese || createEmptyFlavor());
    setKorean(inv.Korean || createEmptyFlavor());
    setGarlic(inv.Garlic || createEmptyFlavor());
    setFurikake(inv.Furikake || createEmptyFlavor());
    setTogarashi(inv.Togarashi || createEmptyFlavor());
    setColeslaw(inv.Coleslaw || createEmptyFlavor());

    const qw = report.qualityAndWastage || {};
    setPromo10Pcs(qw.promo10Pcs || 0);
    setAyamTakHabis(qw.ayamTakHabis || 0);
    setAyamBusuk(qw.ayamBusuk || 0);
    setAyamShort(qw.ayamShort || 0);
    setReview(qw.review || 0);
    setLoyalKad(qw.loyalKad || 0);

    const exp = report.expenses || {};
    setMinyakMasak(exp.minyakMasak || 0);
    setStaffMeal(exp.staffMeal || 0);
    setGas(exp.gas || 0);
    setAis(exp.ais || 0);
    setBeliBarang(exp.beliBarang || 0);
    setMinyakKenderaan(exp.minyakKenderaan || 0);
    setDobi(exp.dobi || 0);

    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName) {
      showToast('Please select a branch.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<SalesReport> = {
        cawangan: branchName,
        branch: branchName,
        date: salesDate,
        submittedBy,
        jumlahBag: bagAyam,
        bagAyam,
        salesCash: Number(salesCash) || 0,
        totalDailySales: currentCalc.grandTotal,
        catatan: catatan.trim(),
        updatedAt: Date.now(),

        platforms: {
          misi: Number(misi) || 0,
          lalamove: Number(lalamove) || 0,
          foodPanda: Number(foodPanda) || 0,
          grabFood: Number(grabFood) || 0,
          shopeeFood: Number(shopeeFood) || 0,
        },

        inventoryTracker: {
          Cheese: { ...cheese, sold: currentCalc.cheeseSold },
          Korean: { ...korean, sold: currentCalc.koreanSold },
          Garlic: { ...garlic, sold: currentCalc.garlicSold },
          Furikake: { ...furikake, sold: currentCalc.furikakeSold },
          Togarashi: { ...togarashi, sold: currentCalc.togarashiSold },
          Coleslaw: { ...coleslaw, sold: currentCalc.coleslawSold },
        },

        qualityAndWastage: {
          promo10Pcs,
          ayamTakHabis,
          ayamBusuk,
          ayamShort,
          review,
          loyalKad,
        },

        expenses: {
          minyakMasak,
          staffMeal,
          gas: Number(gas) || 0,
          ais: Number(ais) || 0,
          beliBarang: Number(beliBarang) || 0,
          minyakKenderaan: Number(minyakKenderaan) || 0,
          dobi: Number(dobi) || 0,
        },
      };

      await onSaveSalesReport(payload, editingKey || undefined);
      setIsModalOpen(false);
      showToast(
        editingKey ? 'Daily sales log updated.' : 'New daily sales entry recorded.',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to save sales report.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Branch',
      'Submitted By',
      'Bag Ayam (Bags)',
      'Sales Cash (RM)',
      'Misi (RM)',
      'Lalamove (RM)',
      'FoodPanda (RM)',
      'GrabFood (RM)',
      'ShopeeFood (RM)',
      'Grand Total (RM)',
      'Inventory Notes',
    ];

    const rows = filteredReports.map((r) => {
      const plat = r.platforms || {};
      return [
        r.date,
        r.cawangan || r.branch,
        r.submittedBy,
        r.jumlahBag ?? r.bagAyam ?? 0,
        Number(r.salesCash || 0).toFixed(2),
        Number(plat.misi || 0).toFixed(2),
        Number(plat.lalamove || 0).toFixed(2),
        Number(plat.foodPanda || 0).toFixed(2),
        Number(plat.grabFood || 0).toFixed(2),
        Number(plat.shopeeFood || 0).toFixed(2),
        Number(r.totalDailySales || 0).toFixed(2),
        r.catatan || '',
      ];
    });

    const result = exportRowsToCSV('daily_sales_reports', headers, rows);
    if (result.success) {
      showToast(`Exported ${result.rowCount} sales reports to CSV.`, 'success');
    } else {
      showToast('No sales reports to export.', 'error');
    }
  };

  const filteredReports = salesReports.filter((report) => {
    const branchStr = (report.cawangan || report.branch || '').toLowerCase();
    const dateStr = report.date || '';
    const matchesBranch = !filterBranch || branchStr === filterBranch.toLowerCase();
    const matchesDate = !filterDate || dateStr === filterDate;
    return matchesBranch && matchesDate;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-700" />
              <span>Daily Sales & Inventory Reports</span>
            </h3>
            <p className="text-xs text-slate-500">
              Raw chicken usage, flavor stock trackers, delivery revenues, and live calculations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Branch Filter */}
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.key} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
            />

            {/* Clear Filter */}
            {(filterBranch || filterDate) && (
              <button
                onClick={() => {
                  setFilterBranch('');
                  setFilterDate('');
                }}
                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {/* Record New Sale */}
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Sales Entry</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200 font-semibold tracking-wider">
              <tr>
                <th className="p-3">Date / Branch</th>
                <th className="p-3">Submitted By</th>
                <th className="p-3">Bag Ayam</th>
                <th className="p-3">Sales Cash</th>
                <th className="p-3">Grand Total Sales</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No sales reports found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const bagAyamVal = report.jumlahBag ?? report.bagAyam ?? 0;
                  const cashVal = Number(report.salesCash || 0).toFixed(2);
                  const grandTotalVal = Number(report.totalDailySales || 0).toFixed(2);

                  return (
                    <tr key={report.key} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">
                          {report.cawangan || report.branch || 'Outlet'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {report.date}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        {report.submittedBy || 'Staff'}
                      </td>
                      <td className="p-3 font-mono text-amber-700 font-semibold">
                        {bagAyamVal} bags
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        RM {cashVal}
                      </td>
                      <td className="p-3 font-mono text-emerald-700 font-bold">
                        RM {grandTotalVal}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(report)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold border border-indigo-200 transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <PenSquare className="w-3 h-3" /> Edit
                        </button>
                        {report.catatan && (
                          <button
                            onClick={() =>
                              showToast(`Notes for ${report.date}: ${report.catatan}`, 'info')
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] border border-slate-200 transition inline-flex items-center gap-1 cursor-pointer"
                            title={report.catatan}
                          >
                            <FileText className="w-3 h-3" /> Notes
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL SALES & INVENTORY EDIT / CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative text-left my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  <span>
                    {editingKey ? 'Edit Daily Sales & Inventory Log' : 'New Daily Sales & Inventory Entry'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Update inventory counts and expense deductions to trigger real-time Grand Total calculation.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 text-xs overflow-y-auto pt-4 pr-1">
              {/* SECTION 1: HEADER & BRANCH INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Branch / Cawangan *
                  </label>
                  <select
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.key} value={b.name}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Report Date *
                  </label>
                  <input
                    type="date"
                    value={salesDate}
                    onChange={(e) => setSalesDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Submitted By
                  </label>
                  <input
                    type="text"
                    value={submittedBy}
                    onChange={(e) => setSubmittedBy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* SECTION 2: RAW CHICKEN & FOOD PLATFORMS */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Drumstick className="w-3.5 h-3.5" /> 1. Raw Chicken & Food Platform Revenue
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-slate-700 mb-1 font-medium">
                      Bag Ayam (Bags)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={bagAyam}
                      onChange={(e) => setBagAyam(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-amber-800 font-mono focus:border-indigo-500 focus:bg-white font-bold"
                    />
                    <span className="text-[9px] text-slate-500 mt-0.5 block">
                      1 bag = 20 pcs @ RM4.50
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">Misi (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={misi}
                      onChange={(e) => setMisi(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">Lalamove (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={lalamove}
                      onChange={(e) => setLalamove(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">Food Panda (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={foodPanda}
                      onChange={(e) => setFoodPanda(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">Grab Food (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={grabFood}
                      onChange={(e) => setGrabFood(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">Shopee Food (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={shopeeFood}
                      onChange={(e) => setShopeeFood(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: FLAVOR & ITEM INVENTORY TRACKER */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5" /> 2. Flavor & Item Inventory Tracker
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    CKG: RM2/cup | T&F: RM3/cup | Coleslaw: RM3.50 (2 cups = RM6.50)
                  </span>
                </div>

                <div className="overflow-x-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <table className="w-full text-center text-xs border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="text-left py-2 px-3">Flavor / Item</th>
                        <th className="py-2 px-2">Prev Stock</th>
                        <th className="py-2 px-2">New Stock</th>
                        <th className="py-2 px-2 text-emerald-700 font-bold">Sold (Auto)</th>
                        <th className="py-2 px-2">Promo Free</th>
                        <th className="py-2 px-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-800">
                      {/* Cheese */}
                      <tr>
                        <td className="text-left font-bold py-2 px-3 text-slate-800">Cheese</td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={cheese.prevStock}
                            onChange={(e) => setCheese({ ...cheese, prevStock: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={cheese.newStock}
                            onChange={(e) => setCheese({ ...cheese, newStock: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            readOnly
                            value={currentCalc.cheeseSold}
                            className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold font-mono text-center rounded-xl py-1.5 px-2 cursor-not-allowed"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={cheese.promoFree}
                            onChange={(e) => setCheese({ ...cheese, promoFree: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={cheese.balance}
                            onChange={(e) => setCheese({ ...cheese, balance: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                      </tr>

                      {/* Korean */}
                      <tr>
                        <td className="text-left font-bold py-2 px-3 text-slate-800">Korean</td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={korean.prevStock}
                            onChange={(e) => setKorean({ ...korean, prevStock: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={korean.newStock}
                            onChange={(e) => setKorean({ ...korean, newStock: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            readOnly
                            value={currentCalc.koreanSold}
                            className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold font-mono text-center rounded-xl py-1.5 px-2 cursor-not-allowed"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={korean.promoFree}
                            onChange={(e) => setKorean({ ...korean, promoFree: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={korean.balance}
                            onChange={(e) => setKorean({ ...korean, balance: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                      </tr>

                      {/* Garlic */}
                      <tr>
                        <td className="text-left font-bold py-2 px-3 text-slate-800">Garlic</td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={garlic.prevStock}
                            onChange={(e) => setGarlic({ ...garlic, prevStock: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={garlic.newStock}
                            onChange={(e) => setGarlic({ ...garlic, newStock: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            readOnly
                            value={currentCalc.garlicSold}
                            className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold font-mono text-center rounded-xl py-1.5 px-2 cursor-not-allowed"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={garlic.promoFree}
                            onChange={(e) => setGarlic({ ...garlic, promoFree: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={garlic.balance}
                            onChange={(e) => setGarlic({ ...garlic, balance: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                      </tr>

                      {/* Furikake */}
                      <tr>
                        <td className="text-left font-bold py-2 px-3 text-slate-800">Furikake</td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={furikake.prevStock}
                            onChange={(e) => setFurikake({ ...furikake, prevStock: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={furikake.newStock}
                            onChange={(e) => setFurikake({ ...furikake, newStock: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            readOnly
                            value={currentCalc.furikakeSold}
                            className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold font-mono text-center rounded-xl py-1.5 px-2 cursor-not-allowed"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={furikake.promoFree}
                            onChange={(e) => setFurikake({ ...furikake, promoFree: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={furikake.balance}
                            onChange={(e) => setFurikake({ ...furikake, balance: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                      </tr>

                      {/* Togarashi */}
                      <tr>
                        <td className="text-left font-bold py-2 px-3 text-slate-800">Togarashi</td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={togarashi.prevStock}
                            onChange={(e) => setTogarashi({ ...togarashi, prevStock: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={togarashi.newStock}
                            onChange={(e) => setTogarashi({ ...togarashi, newStock: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            readOnly
                            value={currentCalc.togarashiSold}
                            className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold font-mono text-center rounded-xl py-1.5 px-2 cursor-not-allowed"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={togarashi.promoFree}
                            onChange={(e) => setTogarashi({ ...togarashi, promoFree: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={togarashi.balance}
                            onChange={(e) => setTogarashi({ ...togarashi, balance: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                      </tr>

                      {/* Coleslaw */}
                      <tr>
                        <td className="text-left font-bold py-2 px-3 text-slate-800">Coleslaw</td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={coleslaw.prevStock}
                            onChange={(e) => setColeslaw({ ...coleslaw, prevStock: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={coleslaw.newStock}
                            onChange={(e) => setColeslaw({ ...coleslaw, newStock: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            readOnly
                            value={currentCalc.coleslawSold}
                            className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold font-mono text-center rounded-xl py-1.5 px-2 cursor-not-allowed"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={coleslaw.promoFree}
                            onChange={(e) => setColeslaw({ ...coleslaw, promoFree: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-1">
                          <input
                            type="number"
                            value={coleslaw.balance}
                            onChange={(e) => setColeslaw({ ...coleslaw, balance: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-2 text-center text-slate-900 font-mono focus:border-indigo-500"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 4: PROMOS & EXPENSE DEDUCTIONS */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" /> 3. Promos & Deductions / Operating Expenses
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">
                      Promo 10pcs Ayam (Sets)
                    </label>
                    <input
                      type="number"
                      value={promo10Pcs}
                      onChange={(e) => setPromo10Pcs(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-indigo-700 font-mono focus:bg-white focus:border-indigo-500"
                    />
                    <span className="text-[9px] text-slate-500">RM53.90 / set</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">
                      Minyak Masak (Packs)
                    </label>
                    <input
                      type="number"
                      value={minyakMasak}
                      onChange={(e) => setMinyakMasak(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-rose-700 font-mono focus:bg-white focus:border-indigo-500"
                    />
                    <span className="text-[9px] text-slate-500">RM5.00 / pack</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">
                      Staff Meal (Pcs)
                    </label>
                    <input
                      type="number"
                      value={staffMeal}
                      onChange={(e) => setStaffMeal(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-rose-700 font-mono focus:bg-white focus:border-indigo-500"
                    />
                    <span className="text-[9px] text-slate-500">@RM4.50 / pc</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">
                      Ayam Tak Habis (Pcs)
                    </label>
                    <input
                      type="number"
                      value={ayamTakHabis}
                      onChange={(e) => setAyamTakHabis(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-rose-700 font-mono focus:bg-white focus:border-indigo-500"
                    />
                    <span className="text-[9px] text-slate-500">@RM4.50 / pc</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">
                      Ayam Busuk (Pcs)
                    </label>
                    <input
                      type="number"
                      value={ayamBusuk}
                      onChange={(e) => setAyamBusuk(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-rose-700 font-mono focus:bg-white focus:border-indigo-500"
                    />
                    <span className="text-[9px] text-slate-500">@RM4.50 / pc</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">
                      Ayam Short (Pcs)
                    </label>
                    <input
                      type="number"
                      value={ayamShort}
                      onChange={(e) => setAyamShort(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-rose-700 font-mono focus:bg-white focus:border-indigo-500"
                    />
                    <span className="text-[9px] text-slate-500">@RM4.50 / pc</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">
                      Review (Pcs)
                    </label>
                    <input
                      type="number"
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-rose-700 font-mono focus:bg-white focus:border-indigo-500"
                    />
                    <span className="text-[9px] text-slate-500">@RM4.50 / pc</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">
                      Loyal Kad (RM)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={loyalKad}
                      onChange={(e) => setLoyalKad(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-rose-700 font-mono focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Operating Direct Expenses */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">Gas (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={gas}
                      onChange={(e) => setGas(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">Ais (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ais}
                      onChange={(e) => setAis(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">Beli Barang (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={beliBarang}
                      onChange={(e) => setBeliBarang(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">Minyak Kenderaan (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={minyakKenderaan}
                      onChange={(e) => setMinyakKenderaan(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">Dobi (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dobi}
                      onChange={(e) => setDobi(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: LIVE GRAND TOTAL SUMMARY PANEL */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-indigo-50/40 border border-indigo-200 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Calculation Breakdown Summary
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold font-mono">Live Recalculating</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Bag Ayam Sales (RM90/bag):</span>
                      <span className="font-mono font-semibold text-slate-900">
                        RM {currentCalc.ayamSales.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Deliveries:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        RM {currentCalc.platformSales.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flavors (CKG + T&F + Coleslaw):</span>
                      <span className="font-mono font-semibold text-slate-900">
                        RM {currentCalc.flavorTotalSale.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Promo 10pcs Ayam:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        RM {currentCalc.promo10pcsTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-slate-600 border-t sm:border-t-0 sm:border-l border-indigo-100 pt-2 sm:pt-0 sm:pl-4">
                    <div className="flex justify-between text-rose-700 font-medium">
                      <span>Operating Deductions & Wastage:</span>
                      <span className="font-mono font-semibold">
                        - RM {currentCalc.totalDeductions.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-indigo-900">
                      <span>Sales Cash Input:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={salesCash}
                        onChange={(e) => setSalesCash(e.target.value)}
                        placeholder="0.00"
                        className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-right font-mono text-slate-900 text-xs focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Calculated Grand Total Daily Sales
                  </span>
                  <span className="text-2xl font-black text-emerald-700 font-mono">
                    RM {currentCalc.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 mb-1 font-medium">
                  Inventory Notes & Remarks
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={2}
                  placeholder="Enter remarks or discrepancy notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Log...' : 'Save & Update Log'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
