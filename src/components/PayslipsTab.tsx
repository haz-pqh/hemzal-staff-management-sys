import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Staff,
  AttendanceLog,
  LeaveRequest,
  PayslipRecord,
  StaffPosition,
  SMEPayrollBreakdown,
} from '../types';
import {
  Calculator,
  ReceiptText,
  FileSpreadsheet,
  FileText,
  Trash2,
  Printer,
  Send,
} from 'lucide-react';
import {
  calculateSMEPayroll,
  POSITION_BASE_SALARIES,
  POSITION_LABELS,
} from '../services/payroll';
import { calculateLeaveBalanceForPeriod } from '../services/leaveBalance';
import { exportRowsToCSV } from '../services/exportCsv';
import { PrintPayslipModal } from './PrintPayslipModal';

interface PayslipsTabProps {
  staffList: Staff[];
  attendanceLogs: AttendanceLog[];
  leaveRequests: LeaveRequest[];
  payslipRecords: PayslipRecord[];
  currentAdminEmail: string;
  onSavePayslip: (
    payslipData: Omit<PayslipRecord, 'key'>,
    file?: File | null
  ) => Promise<void>;
  onDeletePayslip: (key: string) => Promise<void>;
  onViewAttachment: (title: string, src: string, contentType?: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const PayslipsTab: React.FC<PayslipsTabProps> = ({
  staffList,
  attendanceLogs,
  leaveRequests,
  payslipRecords,
  currentAdminEmail,
  onSavePayslip,
  onDeletePayslip,
  onViewAttachment,
  showToast,
}) => {
  const currentMonthPeriod = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const [selectedStaffEmail, setSelectedStaffEmail] = useState('');
  const [position, setPosition] = useState<StaffPosition>('CREW');
  const [payPeriod, setPayPeriod] = useState<string>(currentMonthPeriod);
  const [payslipFile, setPayslipFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print Modal State
  const [selectedPrintPayslip, setSelectedPrintPayslip] = useState<PayslipRecord | null>(null);

  // Update default position when staff member changes
  useEffect(() => {
    if (!selectedStaffEmail) return;
    const staff = staffList.find(
      (s) => s.email.toLowerCase() === selectedStaffEmail.toLowerCase()
    );
    if (staff && staff.position) {
      const posUpper = staff.position.toUpperCase() as StaffPosition;
      if (posUpper in POSITION_BASE_SALARIES) {
        setPosition(posUpper);
      }
    }
  }, [selectedStaffEmail, staffList]);

  // Leave balance & unpaid-day scan for the selected pay period. Absences and
  // approved leave first draw from the staff member's carried leave balance
  // (4 weekday + 2 weekend, replenished monthly); only days that exceed that
  // balance count as unpaid and get deducted from the payslip.
  const leavePeriodSummary = useMemo(() => {
    if (!selectedStaffEmail || !payPeriod) return null;
    return calculateLeaveBalanceForPeriod(selectedStaffEmail, attendanceLogs, leaveRequests, payPeriod);
  }, [selectedStaffEmail, payPeriod, attendanceLogs, leaveRequests]);

  // Real-time Attendance Scanner & SME Payroll Calculator
  const payrollCalc = useMemo((): SMEPayrollBreakdown => {
    const basic = POSITION_BASE_SALARIES[position] || 1700.0;
    if (!selectedStaffEmail || !payPeriod) {
      return calculateSMEPayroll(basic, 0, 0);
    }

    const email = selectedStaffEmail.toLowerCase().trim();
    let presentCount = 0;

    attendanceLogs.forEach((log) => {
      const logEmail = (log.userEmail || '').toLowerCase().trim();
      const logDate = String(log.date || '');
      const status = (log.punctualityStatus || '').toUpperCase().trim();

      const isStaffMatch = logEmail === email;
      const isPeriodMatch = logDate.startsWith(payPeriod);

      if (isStaffMatch && isPeriodMatch) {
        if (
          ['ON TIME', 'LATE', 'PRESENT', 'HALF DAY'].includes(status) ||
          (log.clockIn && log.clockIn !== '--')
        ) {
          presentCount++;
        }
      }
    });

    // Unpaid days = absences + approved leave days that exceeded the
    // available leave balance for this pay period.
    const unpaidCount = leavePeriodSummary?.unpaidDays || 0;

    return calculateSMEPayroll(basic, unpaidCount, presentCount);
  }, [selectedStaffEmail, position, payPeriod, attendanceLogs, leavePeriodSummary]);

  // Helper to read file as Base64 for Firestore storage fallback
  const readFileAsBase64 = (file: File): Promise<{ fileData: string; contentType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        resolve({ fileData: base64, contentType: file.type || 'application/pdf' });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffEmail || !payPeriod) {
      showToast('Please select a staff member and pay period.', 'error');
      return;
    }

    const staff = staffList.find(
      (s) => s.email.toLowerCase() === selectedStaffEmail.toLowerCase()
    );
    const staffName = staff?.name || selectedStaffEmail.split('@')[0];

    setIsSubmitting(true);
    try {
      let attachmentDetails: { fileData?: string; contentType?: string } = {};

      if (payslipFile) {
        attachmentDetails = await readFileAsBase64(payslipFile);
      }

      const payslipPayload: Omit<PayslipRecord, 'key'> = {
        staffName,
        staffEmail: selectedStaffEmail,
        position: POSITION_LABELS[position] || position,
        period: payPeriod,
        amount: payrollCalc.netSalary,
        uploadedAt: Date.now(),
        uploadedBy: currentAdminEmail || 'Admin',
        breakdown: payrollCalc,
        ...attachmentDetails,
      };

      await onSavePayslip(payslipPayload, payslipFile);

      setPayslipFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      showToast('Payslip generated and saved successfully.', 'success');
    } catch (err: any) {
      if (err?.name === 'PayslipSaveCancelled') {
        showToast('Payslip save cancelled.', 'info');
      } else {
        showToast(err.message || 'Failed to save payslip.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Staff Name',
      'Staff Email',
      'Position',
      'Pay Period',
      'Net Salary (RM)',
      'Uploaded Date',
      'Uploaded By',
    ];
    const rows = payslipRecords.map((r) => [
      r.staffName,
      r.staffEmail,
      r.position,
      r.period,
      Number(r.amount || 0).toFixed(2),
      r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString() : '',
      r.uploadedBy || '',
    ]);

    const result = exportRowsToCSV('staff_payslips_record', headers, rows);
    if (result.success) {
      showToast(`Exported ${result.rowCount} payslip records to CSV.`, 'success');
    } else {
      showToast('No payslip records to export.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SME MALAYSIA AUTOMATED PAYROLL GENERATOR */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-700" />
              <span>SME Malaysia Automated Staff Payslip Generator</span>
            </h3>
            <p className="text-xs text-slate-500">
              Employment Act 1955 compliant payroll & automatic attendance deduction engine
            </p>
          </div>
          <span className="text-[10px] text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl font-semibold">
            Malaysia EA 1955 Standards
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Staff, Position, Period */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Select Staff Member *
              </label>
              <select
                value={selectedStaffEmail}
                onChange={(e) => setSelectedStaffEmail(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
              >
                <option value="">Choose Staff Member</option>
                {staffList.map((s) => (
                  <option key={s.key} value={s.email}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Designation & Standard Base Salary *
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as StaffPosition)}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="MANAGER">Branch Manager (RM 3,500.00)</option>
                <option value="SUPERVISOR">Supervisor (RM 2,500.00)</option>
                <option value="SENIOR_CREW">Senior Kitchen Crew (RM 2,000.00)</option>
                <option value="CREW">Kitchen / Service Crew (RM 1,700.00)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Pay Period Month *
              </label>
              <input
                type="month"
                value={payPeriod}
                onChange={(e) => setPayPeriod(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
              />
            </div>
          </div>

          {/* LIVE ATTENDANCE & SME STATUTORY BREAKDOWN CARD */}
          <div className="bg-slate-50 border border-indigo-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <ReceiptText className="w-3.5 h-3.5 text-indigo-700" /> Attendance & Statutory Calculation Breakdown
              </span>
              <span className="text-[11px] text-emerald-800 font-mono font-bold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 self-start sm:self-auto">
                Present: {payrollCalc.presentDays} days | Unpaid: {payrollCalc.absentDays} days
              </span>
            </div>

            {leavePeriodSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-white p-2.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Opening Balance</span>
                  <span className="text-slate-900 font-mono font-bold">
                    {leavePeriodSummary.openingWeekdayBalance}wd + {leavePeriodSummary.openingWeekendBalance}we
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Used This Period</span>
                  <span className="text-indigo-700 font-mono font-bold">
                    {leavePeriodSummary.weekdayUsed}wd + {leavePeriodSummary.weekendUsed}we
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Unpaid (Excess)</span>
                  <span
                    className={`font-mono font-bold ${
                      leavePeriodSummary.unpaidDays > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {leavePeriodSummary.unpaidWeekdayDays}wd + {leavePeriodSummary.unpaidWeekendDays}we
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Closing Balance</span>
                  <span className="text-slate-900 font-mono font-bold">
                    {leavePeriodSummary.closingWeekdayBalance}wd + {leavePeriodSummary.closingWeekendBalance}we
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 text-[10px] block font-medium">Basic Salary</span>
                <span className="text-slate-900 font-mono font-bold text-sm">
                  RM {payrollCalc.basicSalary.toFixed(2)}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-rose-700 text-[10px] block font-medium">
                  Unpaid Day Deduction (/26 days)
                </span>
                <span className="text-rose-700 font-mono font-bold text-sm">
                  - RM {payrollCalc.absentDeduction.toFixed(2)}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-indigo-800 text-[10px] block font-medium">
                  Calculated Gross Salary
                </span>
                <span className="text-indigo-800 font-mono font-bold text-sm">
                  RM {payrollCalc.grossSalary.toFixed(2)}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-amber-800 text-[10px] block font-medium">
                  Employee Deductions (EPF/SOCSO/EIS)
                </span>
                <span className="text-amber-800 font-mono font-bold text-sm">
                  - RM {payrollCalc.totalDeductions.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Statutory Rates Table */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="flex justify-between sm:justify-start sm:gap-2">
                <span>KWSP / EPF (11%):</span>
                <span className="text-slate-900 font-mono font-semibold">
                  RM {payrollCalc.epfEmployee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between sm:justify-start sm:gap-2">
                <span>PERKESO / SOCSO (0.5%):</span>
                <span className="text-slate-900 font-mono font-semibold">
                  RM {payrollCalc.socsoEmployee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between sm:justify-start sm:gap-2">
                <span>SIP / EIS (0.2%):</span>
                <span className="text-slate-900 font-mono font-semibold">
                  RM {payrollCalc.eisEmployee.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Net Salary & File Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Calculated Net Salary Payable (RM) *
              </label>
              <input
                type="text"
                readOnly
                value={`RM ${payrollCalc.netSalary.toFixed(2)}`}
                className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold font-mono text-base rounded-xl px-3 py-2.5 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Attach External Payslip Document (Optional PDF / Image)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setPayslipFile(e.target.files?.[0] || null)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-xl px-3 py-1.5 focus:outline-none file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSubmitting ? 'Generating & Uploading...' : 'Generate & Save Payslip Record'}
            </span>
          </button>
        </form>
      </div>

      {/* 2. TABLE OF STORED PAYSLIPS */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-emerald-700" />
              <span>Generated & Uploaded Payslips Record</span>
            </h3>
            <p className="text-xs text-slate-500">
              Historical payslip archive, printable vouchers, and compliance records
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200 font-semibold tracking-wider">
              <tr>
                <th className="p-3">Staff Member</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Pay Period</th>
                <th className="p-3">Net Salary</th>
                <th className="p-3">Generated Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {payslipRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No payslips generated or uploaded yet.
                  </td>
                </tr>
              ) : (
                payslipRecords.map((record) => {
                  const amountNum = Number(record.amount);
                  const amountText = Number.isFinite(amountNum)
                    ? `RM ${amountNum.toFixed(2)}`
                    : '--';

                  return (
                    <tr key={record.key} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block capitalize">
                          {record.staffName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {record.staffEmail}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{record.position}</td>
                      <td className="p-3 font-mono text-indigo-700 font-semibold">
                        {record.period}
                      </td>
                      <td className="p-3 font-mono text-emerald-700 font-bold">
                        {amountText}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {record.uploadedAt
                          ? new Date(record.uploadedAt).toLocaleDateString()
                          : '--'}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => setSelectedPrintPayslip(record)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                          title="View & Print Official Payslip Voucher"
                        >
                          <Printer className="w-3 h-3" /> Voucher
                        </button>

                        {record.fileData && (
                          <button
                            onClick={() =>
                              onViewAttachment(
                                `Payslip Document: ${record.staffName} (${record.period})`,
                                `data:${record.contentType || 'application/pdf'};base64,${record.fileData}`,
                                record.contentType
                              )
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200 transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3 h-3" /> Doc
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Delete payslip record for ${record.staffName} (${record.period})?`
                              )
                            ) {
                              onDeletePayslip(record.key);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold border border-rose-200 transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPrintPayslip && (
        <PrintPayslipModal
          payslip={selectedPrintPayslip}
          onClose={() => setSelectedPrintPayslip(null)}
        />
      )}
    </div>
  );
};
