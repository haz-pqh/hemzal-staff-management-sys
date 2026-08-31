import React, { useState, useEffect, useRef } from 'react';
import {
  AttendanceLog,
  Staff,
  AttendancePunctuality,
} from '../types';
import {
  Clock,
  Search,
  FileSpreadsheet,
  PlusCircle,
  RotateCcw,
  Paperclip,
  PenSquare,
  Trash2,
  X,
  FileText,
  AlertTriangle,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { exportRowsToCSV } from '../services/exportCsv';

interface AttendanceTabProps {
  attendanceLogs: AttendanceLog[];
  staffList: Staff[];
  onSaveManualAttendance: (logData: Partial<AttendanceLog>, file?: File | null) => Promise<void>;
  onUpdateAttendanceLog: (key: string, updates: Partial<AttendanceLog>) => Promise<void>;
  onDeleteAttendanceLog: (key: string) => Promise<void>;
  onViewAttachment: (title: string, src: string, contentType?: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  attendanceLogs,
  staffList,
  onSaveManualAttendance,
  onUpdateAttendanceLog,
  onDeleteAttendanceLog,
  onViewAttachment,
  showToast,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Manual Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedStaffEmail, setSelectedStaffEmail] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(todayStr);
  const [punctualityStatus, setPunctualityStatus] = useState<AttendancePunctuality>('EMERGENCY LEAVE');
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Edit Log Modal
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [editClockIn, setEditClockIn] = useState('');
  const [editClockOut, setEditClockOut] = useState('');
  const [editStatus, setEditStatus] = useState<AttendancePunctuality>('PRESENT');
  const [editRemarks, setEditRemarks] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Ref to prevent duplicate auto-absent triggers on re-render
  const hasAutoChecked = useRef(false);

  // Auto Absent Check Logic
  useEffect(() => {
    const runAutoAbsentCheck = async () => {
      if (!staffList.length || hasAutoChecked.current) return;
      hasAutoChecked.current = true;

      for (const staff of staffList) {
        // 1. Check if a record already exists in database logs for today
        const existingRecord = attendanceLogs.find(
          (log) =>
            log.userEmail?.toLowerCase() === staff.email?.toLowerCase() &&
            log.date === todayStr
        );

        // 2. Skip if data already exists
        if (existingRecord) {
          continue;
        }

        // 3. Push absent record only if no existing data found
        try {
          await onSaveManualAttendance({
            empName: staff.name,
            userEmail: staff.email,
            date: todayStr,
            punctualityStatus: 'ABSENT' as AttendancePunctuality,
            clockIn: '--',
            clockOut: '--',
            remarks: 'Auto-marked absent (No record found)',
            durationText: 'Full Day Record',
            createdByAdmin: true,
            timestamp: Date.now(),
          });
        } catch (err) {
          console.error(`Failed auto-absent record for ${staff.name}:`, err);
        }
      }
    };

    runAutoAbsentCheck();
  }, [staffList, attendanceLogs, todayStr, onSaveManualAttendance]);

  const resetManualForm = () => {
    setSelectedStaffEmail('');
    setAttendanceDate(todayStr);
    setPunctualityStatus('EMERGENCY LEAVE');
    setClockIn('');
    setClockOut('');
    setRemarks('');
    setAttachedFile(null);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffEmail) {
      showToast('Please select a staff member.', 'error');
      return;
    }

    const staff = staffList.find(
      (s) => s.email.toLowerCase() === selectedStaffEmail.toLowerCase()
    );
    const staffName = staff?.name || selectedStaffEmail.split('@')[0];

    setIsSubmittingManual(true);
    try {
      await onSaveManualAttendance(
        {
          empName: staffName,
          userEmail: selectedStaffEmail,
          date: attendanceDate,
          punctualityStatus,
          clockIn: clockIn || '--',
          clockOut: clockOut || '--',
          remarks: remarks.trim(),
          durationText:
            clockIn && clockOut ? `${clockIn} - ${clockOut}` : 'Full Day Record',
          createdByAdmin: true,
          timestamp: Date.now(),
        },
        attachedFile
      );
      resetManualForm();
      showToast('Attendance log registered successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit attendance log.', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleOpenEdit = (log: AttendanceLog) => {
    setEditingLog(log);
    setEditClockIn(log.clockIn === '--' ? '' : log.clockIn);
    setEditClockOut(log.clockOut === '--' ? '' : log.clockOut);
    setEditStatus(log.punctualityStatus || 'PRESENT');
    setEditRemarks(log.remarks || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    setIsSavingEdit(true);
    try {
      await onUpdateAttendanceLog(editingLog.key, {
        clockIn: editClockIn || '--',
        clockOut: editClockOut || '--',
        punctualityStatus: editStatus,
        remarks: editRemarks.trim(),
        editedByAdmin: true,
        lastModifiedAt: Date.now(),
      });
      setEditingLog(null);
      showToast('Attendance log updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update attendance log.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Staff Name',
      'Email',
      'Clock In',
      'Clock Out',
      'Remarks',
      'Status',
    ];
    const rows = filteredLogs.map((log) => [
      log.date,
      log.empName,
      log.userEmail,
      log.clockIn,
      log.clockOut,
      log.remarks || log.durationText || '',
      log.punctualityStatus,
    ]);

    const result = exportRowsToCSV('attendance_logs', headers, rows);
    if (result.success) {
      showToast(`Exported ${result.rowCount} attendance records to CSV.`, 'success');
    } else {
      showToast('No attendance logs to export.', 'error');
    }
  };

  const filteredLogs = attendanceLogs.filter((log) => {
    const query = search.toLowerCase();
    const matchesSearch =
      (log.empName || '').toLowerCase().includes(query) ||
      (log.userEmail || '').toLowerCase().includes(query) ||
      (log.punctualityStatus || '').toLowerCase().includes(query) ||
      (log.date || '').includes(query);

    const matchesStatus =
      statusFilter === 'ALL' || log.punctualityStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Auto-Absent Rule Banner */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block">
              11:00 AM Automated Cutoff & Auto-Absent Engine Active
            </span>
            <span className="text-slate-600 text-[11px]">
              Employees without clock-in or approved leave by 11:00 AM are automatically flagged as ABSENT.
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
          Running
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Attendance Logs Table (2 columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Attendance Logs ({filteredLogs.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Live staff check-ins, duty shifts, and registered logs
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-44">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="ALL">All Status</option>
                <option value="ON TIME">On Time</option>
                <option value="LATE">Late</option>
                <option value="ABSENT">Absent</option>
                <option value="EMERGENCY LEAVE">Emergency Leave</option>
                <option value="MEDICAL LEAVE">Medical Leave</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Export filtered logs to Excel CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="p-3">Date</th>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">In</th>
                  <th className="p-3">Out</th>
                  <th className="p-3">Remarks / Duration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      No matching attendance records found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const status = log.punctualityStatus || 'ON TIME';
                    let badgeColor =
                      'bg-emerald-50 text-emerald-700 border-emerald-200';

                    if (status === 'ABSENT' || log.statusColor === 'red') {
                      badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                    } else if (
                      status === 'EMERGENCY LEAVE' ||
                      status === 'MEDICAL LEAVE'
                    ) {
                      badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                    } else if (status === 'LATE') {
                      badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
                    }

                    const hasFile =
                      log.hasAttachment &&
                      (log.attachmentUrl || log.attachmentBase64);

                    return (
                      <tr key={log.key} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {log.date}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">
                            {log.empName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {log.userEmail}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-900 font-semibold">
                          {log.clockIn}
                        </td>
                        <td className="p-3 font-mono text-slate-900 font-semibold">
                          {log.clockOut}
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">
                          {log.remarks || log.durationText || '--'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${badgeColor}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap space-x-1">
                          {hasFile && (
                            <button
                              onClick={() =>
                                onViewAttachment(
                                  `Attendance: ${log.empName} (${log.date})`,
                                  log.attachmentUrl || log.attachmentBase64 || '',
                                  log.attachmentContentType
                                )
                              }
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-indigo-700 text-[10px] font-semibold rounded-lg border border-slate-200 transition inline-flex items-center gap-1 cursor-pointer"
                              title="View uploaded document/MC"
                            >
                              <Paperclip className="w-3 h-3" /> File
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(log)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-semibold rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <PenSquare className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this attendance entry?')) {
                                onDeleteAttendanceLog(log.key);
                              }
                            }}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-semibold rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
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

        {/* Right Side: Manual & Emergency Entry Form (1 col sticky) */}
        <div className="lg:col-span-1 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>Manual / Emergency Entry</span>
            </h3>
            <button
              onClick={resetManualForm}
              className="text-[11px] text-slate-500 hover:text-slate-900 transition flex items-center gap-1 cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-3.5 text-xs">
            {/* Staff Selection */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Select Staff Member *
              </label>
              <select
                value={selectedStaffEmail}
                onChange={(e) => setSelectedStaffEmail(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="">Choose Staff Member</option>
                {staffList.map((s) => (
                  <option key={s.key} value={s.email}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Status */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Log Date *
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Status *
                </label>
                <select
                  value={punctualityStatus}
                  onChange={(e) => setPunctualityStatus(e.target.value as AttendancePunctuality)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  <option value="EMERGENCY LEAVE">Emergency (EL)</option>
                  <option value="MEDICAL LEAVE">Medical (MC)</option>
                  <option value="ON TIME">Present (On Time)</option>
                  <option value="LATE">Present (Late)</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF DAY">Half Day</option>
                </select>
              </div>
            </div>

            {/* Clock In / Out */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Clock In (Optional)
                </label>
                <input
                  type="time"
                  value={clockIn}
                  onChange={(e) => setClockIn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Clock Out (Optional)
                </label>
                <input
                  type="time"
                  value={clockOut}
                  onChange={(e) => setClockOut(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Reason / Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="State emergency or attendance notes..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
              />
            </div>

            {/* File Attachment */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Attachment (MC / Letter / PDF)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-slate-100 file:text-indigo-700 hover:file:bg-slate-200 cursor-pointer"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmittingManual}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-xs shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmittingManual ? 'Saving Entry...' : 'Submit Entry'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Edit Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PenSquare className="w-4 h-4 text-indigo-600" />
                <span>Edit Attendance Log</span>
              </h3>
              <button
                onClick={() => setEditingLog(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Staff Member
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${editingLog.empName} (${editingLog.userEmail})`}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-600 rounded-xl px-3 py-2 cursor-not-allowed font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Clock In
                  </label>
                  <input
                    type="time"
                    value={editClockIn}
                    onChange={(e) => setEditClockIn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Clock Out
                  </label>
                  <input
                    type="time"
                    value={editClockOut}
                    onChange={(e) => setEditClockOut(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AttendancePunctuality)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  <option value="ON TIME">ON TIME</option>
                  <option value="LATE">LATE</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="EMERGENCY LEAVE">EMERGENCY LEAVE</option>
                  <option value="MEDICAL LEAVE">MEDICAL LEAVE</option>
                  <option value="HALF DAY">HALF DAY</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Remarks
                </label>
                <textarea
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
