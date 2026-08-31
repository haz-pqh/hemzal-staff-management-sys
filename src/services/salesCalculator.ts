import { FlavorInventoryItem, SalesReport } from '../types';

export interface SalesCalculationResult {
  ayamSales: number;
  totalAyamPcs: number;
  platformSales: number;
  ckgTotalSale: number;
  tfTotalSale: number;
  coleslawTotalSale: number;
  flavorTotalSale: number;
  promo10pcsTotal: number;
  totalDeductions: number;
  minyakMasakDeduction: number;
  chickenLossDeduction: number;
  operatingExpenses: number;
  grandTotal: number;
  cheeseSold: number;
  koreanSold: number;
  garlicSold: number;
  furikakeSold: number;
  togarashiSold: number;
  coleslawSold: number;
}

export function calculateFlavorSold(item?: Partial<FlavorInventoryItem>): number {
  if (!item) return 0;
  const prev = Number(item.prevStock) || 0;
  const next = Number(item.newStock) || 0;
  const promo = Number(item.promoFree) || 0;
  const bal = Number(item.balance) || 0;
  return Math.max(0, (prev + next) - (promo + bal));
}

export function computeSalesReport(report: Partial<SalesReport>): SalesCalculationResult {
  // 1. Raw Chicken: 1 bag = 20 pcs @ RM4.50 each = RM90/bag
  const bagAyam = Number(report.jumlahBag ?? report.bagAyam ?? 0);
  const totalAyamPcs = bagAyam * 20;
  const ayamSales = totalAyamPcs * 4.50;

  // 2. Platforms
  const plat = report.platforms || {};
  const misi = Number(plat.misi) || 0;
  const lalamove = Number(plat.lalamove) || 0;
  const foodPanda = Number(plat.foodPanda) || 0;
  const grabFood = Number(plat.grabFood) || 0;
  const shopeeFood = Number(plat.shopeeFood) || 0;
  const platformSales = misi + lalamove + foodPanda + grabFood + shopeeFood;

  // 3. Flavors
  const inv = report.inventoryTracker || {};
  const cheeseSold = calculateFlavorSold(inv.Cheese);
  const koreanSold = calculateFlavorSold(inv.Korean);
  const garlicSold = calculateFlavorSold(inv.Garlic);
  const ckgTotalSale = (cheeseSold + koreanSold + garlicSold) * 2.00;

  const furikakeSold = calculateFlavorSold(inv.Furikake);
  const togarashiSold = calculateFlavorSold(inv.Togarashi);
  const tfTotalSale = (furikakeSold + togarashiSold) * 3.00;

  const coleslawSold = calculateFlavorSold(inv.Coleslaw);
  const coleslawPairs = Math.floor(coleslawSold / 2);
  const coleslawRem = coleslawSold % 2;
  const coleslawTotalSale = (coleslawPairs * 6.50) + (coleslawRem * 3.50);

  const flavorTotalSale = ckgTotalSale + tfTotalSale + coleslawTotalSale;

  // 4. Promos & Deductions
  const qw = report.qualityAndWastage || {};
  const promo10pcsQty = Number(qw.promo10Pcs ?? 0);
  const promo10pcsTotal = promo10pcsQty * 53.90;

  const exp = report.expenses || {};
  const gas = Number(exp.gas) || 0;
  const ais = Number(exp.ais) || 0;
  const beliBarang = Number(exp.beliBarang) || 0;
  const minyakKenderaan = Number(exp.minyakKenderaan) || 0;
  const dobi = Number(exp.dobi) || 0;
  const operatingExpenses = gas + ais + beliBarang + minyakKenderaan + dobi;

  const minyakMasakPacks = Number(exp.minyakMasak) || 0;
  const minyakMasakDeduction = minyakMasakPacks * 5.00;

  const staffMealPcs = Number(exp.staffMeal) || 0;
  const ayamTakHabisPcs = Number(qw.ayamTakHabis) || 0;
  const ayamBusukPcs = Number(qw.ayamBusuk) || 0;
  const ayamShortPcs = Number(qw.ayamShort) || 0;
  const reviewPcs = Number(qw.review) || 0;
  const loyalKad = Number(qw.loyalKad) || 0;

  const chickenLossDeduction = (staffMealPcs + ayamTakHabisPcs + ayamBusukPcs + ayamShortPcs + reviewPcs) * 4.50;
  const totalDeductions = operatingExpenses + minyakMasakDeduction + chickenLossDeduction + loyalKad;

  const salesCash = Number(report.salesCash) || 0;
  // Grand total formula
  const grandTotal = (ayamSales + platformSales) - totalDeductions + flavorTotalSale + promo10pcsTotal;

  return {
    ayamSales,
    totalAyamPcs,
    platformSales,
    ckgTotalSale,
    tfTotalSale,
    coleslawTotalSale,
    flavorTotalSale,
    promo10pcsTotal,
    totalDeductions,
    minyakMasakDeduction,
    chickenLossDeduction,
    operatingExpenses,
    grandTotal,
    cheeseSold,
    koreanSold,
    garlicSold,
    furikakeSold,
    togarashiSold,
    coleslawSold,
  };
}
