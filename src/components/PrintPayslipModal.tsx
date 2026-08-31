import React from 'react';
import { PayslipRecord } from '../types';
import { Printer, X, Building2, CheckCircle2, Shield } from 'lucide-react';

interface PrintPayslipModalProps {
  payslip: PayslipRecord | null;
  onClose: () => void;
}

export const PrintPayslipModal: React.FC<PrintPayslipModalProps> = ({
  payslip,
  onClose,
}) => {
  if (!payslip) return null;

  const handlePrint = () => {
    window.print();
  };

  const amount = Number(payslip.amount) || 0;
  const breakdown = payslip.breakdown;

  const basicSalary = breakdown?.basicSalary || 1700;
  const absentDays = breakdown?.absentDays || 0;
  const absentDeduction = breakdown?.absentDeduction || 0;
  const grossSalary = breakdown?.grossSalary || basicSalary - absentDeduction;
  const epf = breakdown?.epfEmployee || Math.round(grossSalary * 0.11 * 100) / 100;
  const socso = breakdown?.socsoEmployee || Math.round(Math.min(grossSalary, 5000) * 0.005 * 100) / 100;
  const eis = breakdown?.eisEmployee || Math.round(Math.min(grossSalary, 5000) * 0.002 * 100) / 100;
  const totalDeductions = breakdown?.totalDeductions || epf + socso + eis;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative text-left my-8">
        {/* Top bar (hide in print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Official Payslip Statement
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/25"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-200 space-y-6 text-xs print:bg-white print:text-black print:border-none print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black text-white print:text-black tracking-wide flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400 print:text-black" />
                ENTERPRISE MANAGEMENT SDN. BHD.
              </h2>
              <p className="text-[11px] text-slate-400 print:text-gray-600 mt-0.5">
                Reg No: 202401088921 (1459200-X) | SME Malaysia Employment Act 1955
              </p>
              <p className="text-[10px] text-slate-500 print:text-gray-500">
                Kuala Lumpur, Malaysia
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 print:bg-gray-100 print:text-black">
                Monthly Payslip
              </span>
              <p className="text-xs font-bold font-mono text-slate-300 print:text-black mt-2">
                Period: {payslip.period}
              </p>
            </div>
          </div>

          {/* Employee Info Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-900/60 print:bg-gray-50 p-4 rounded-xl border border-slate-800/80 print:border-gray-200">
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-500 block">Employee Name</span>
              <span className="text-xs font-bold text-white print:text-black">{payslip.staffName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-500 block">Email / ID</span>
              <span className="text-xs font-mono text-slate-300 print:text-black">{payslip.staffEmail}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-500 block">Designation</span>
              <span className="text-xs font-semibold text-slate-200 print:text-black">{payslip.position}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-500 block">Payment Date</span>
              <span className="text-xs font-mono text-slate-200 print:text-black">
                {new Date(payslip.uploadedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Earnings & Deductions Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Earnings */}
            <div className="border border-slate-800 print:border-gray-200 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-xs text-indigo-400 print:text-black uppercase tracking-wider pb-1 border-b border-slate-800">
                1. Earnings (Pendapatan)
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Basic Monthly Salary</span>
                <span className="font-mono font-semibold">RM {basicSalary.toFixed(2)}</span>
              </div>
              {absentDays > 0 && (
                <div className="flex justify-between text-rose-400 print:text-red-600">
                  <span>Absent Deductions ({absentDays} days)</span>
                  <span className="font-mono">- RM {absentDeduction.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-800/80 font-bold text-white print:text-black">
                <span>Gross Earnings</span>
                <span className="font-mono">RM {grossSalary.toFixed(2)}</span>
              </div>
            </div>

            {/* Right: Statutory Deductions */}
            <div className="border border-slate-800 print:border-gray-200 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-xs text-amber-400 print:text-black uppercase tracking-wider pb-1 border-b border-slate-800">
                2. Employee Statutory Deductions
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">KWSP / EPF (11%)</span>
                <span className="font-mono text-amber-300 print:text-black">- RM {epf.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">PERKESO / SOCSO (0.5%)</span>
                <span className="font-mono text-amber-300 print:text-black">- RM {socso.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">SIP / EIS (0.2%)</span>
                <span className="font-mono text-amber-300 print:text-black">- RM {eis.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800/80 font-bold text-rose-300 print:text-black">
                <span>Total Statutory Deductions</span>
                <span className="font-mono">- RM {totalDeductions.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Net Salary Summary Box */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 print:bg-gray-100 border border-emerald-500/40 print:border-gray-300 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-600 uppercase font-bold tracking-wider block">
                Total Net Salary Payable
              </span>
              <span className="text-xs text-emerald-400 print:text-emerald-700 font-semibold">
                Credited directly to employee registered bank account
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-400 print:text-black font-mono">
              RM {amount.toFixed(2)}
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-400 print:text-gray-500">
            <div>
              <div className="border-b border-slate-700 print:border-gray-400 pb-8 mb-2"></div>
              <span>Authorized Employer Signature</span>
            </div>
            <div>
              <div className="border-b border-slate-700 print:border-gray-400 pb-8 mb-2"></div>
              <span>Employee Signature & Date</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
