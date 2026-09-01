import React, { useState } from 'react';
import { AttendanceLog, LeaveRequest, Staff, LeaveType, LeaveStatus } from '../types';
import { estimateLeaveRequestImpact } from '../services/leaveBalance';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  PenSquare,
  Trash2,
  Paperclip,
  AlertTriangle,
  Filter,
  UserCheck,
  Sparkles,
} from 'lucide-react';

interface LeavesTabProps {
  leaveRequests: LeaveRequest[];
  staffList: Staff[];
  attendanceLogs: AttendanceLog[];
  onUpdateLeaveStatus: (key: string, status: LeaveStatus) => Promise<void>;
  onEditLeaveRequest: (key: string, updates: Partial<LeaveRequest>) => Promise<void>;
  onDeleteLeaveRequest: (key: string) => Promise<void>;
  onViewAttachment: (title: string, src: string, contentType?: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const LeavesTab: React.FC<LeavesTabProps> = ({
  leaveRequests,
  staffList,
  attendanceLogs,
  onUpdateLeaveStatus,
  onEditLeaveRequest,
  onDeleteLeaveRequest,
  onViewAttachment,
  showToast,
}) => {
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Edit Modal State
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editLeaveType, setEditLeaveType] = useState<LeaveType>('MEDICAL');
  const [editLeaveStatus, setEditLeaveStatus] = useState<LeaveStatus>('APPROVED');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editReason, setEditReason] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Calendar calculations
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const changeMonth = (delta: number) => {
    const next = new Date(currentCalendarDate);
    next.setMonth(next.getMonth() + delta);
    setCurrentCalendarDate(next);
  };

  const resetToToday = () => {
    setCurrentCalendarDate(new Date());
    setSelectedCalendarDate(null);
  };

  const handleDateClick = (dateStr: string) => {
    if (selectedCalendarDate === dateStr) {
      setSelectedCalendarDate(null);
    } else {
      setSelectedCalendarDate(dateStr);
    }
  };

  // Checks the staff member's leave balance before approving a request and
  // warns the admin when the application exceeds it (i.e. will be unpaid).
  const handleApproveClick = async (req: LeaveRequest) => {
    const impact = estimateLeaveRequestImpact(req.userEmail, attendanceLogs, leaveRequests, {
      startDate: req.startDate,
      endDate: req.endDate,
      excludeKey: req.key,
    });

    if (impact.unpaidDays > 0) {
      const proceed = window.confirm(
        `Balance Alert: ${req.empName || req.userEmail} only has ${impact.availableWeekdayBalance} weekday + ${impact.availableWeekendBalance} weekend leave available, but this application uses ${impact.requestedDays} day(s).\n\n` +
          `${impact.unpaidDays} day(s) of this leave will exceed the balance and be recorded as UNPAID LEAVE (deducted from payslip).\n\n` +
          `Approve anyway?`
      );
      if (!proceed) return;
    }

    await onUpdateLeaveStatus(req.key, 'APPROVED');
    if (impact.unpaidDays > 0) {
      showToast(
        `Leave approved. ${impact.unpaidDays} day(s) exceed balance and will be unpaid.`,
        'info'
      );
    }
  };

  const handleOpenEdit = (req: LeaveRequest) => {
    setEditingLeave(req);
    setEditStaffEmail(req.userEmail || '');
    setEditLeaveType(req.leaveType || 'MEDICAL');
    setEditLeaveStatus(req.status || 'APPROVED');
    setEditStartDate(req.startDate || '');
    setEditEndDate(req.endDate || '');
    setEditReason(req.reason || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeave) return;

    const staff = staffList.find((s) => s.email.toLowerCase() === editStaffEmail.toLowerCase());
    const empName = staff?.name || editStaffEmail.split('@')[0];

    if (editLeaveStatus === 'APPROVED') {
      const impact = estimateLeaveRequestImpact(editStaffEmail, attendanceLogs, leaveRequests, {
        startDate: editStartDate,
        endDate: editEndDate,
        excludeKey: editingLeave.key,
      });
      if (impact.unpaidDays > 0) {
        const proceed = window.confirm(
          `Balance Alert: ${empName} only has ${impact.availableWeekdayBalance} weekday + ${impact.availableWeekendBalance} weekend leave available, but this application uses ${impact.requestedDays} day(s).\n\n` +
            `${impact.unpaidDays} day(s) of this leave will exceed the balance and be recorded as UNPAID LEAVE (deducted from payslip).\n\n` +
            `Save as approved anyway?`
        );
        if (!proceed) return;
      }
    }

    setIsSavingEdit(true);
    try {
      await onEditLeaveRequest(editingLeave.key, {
        empName,
        userEmail: editStaffEmail,
        leaveType: editLeaveType,
        status: editLeaveStatus,
        startDate: editStartDate,
        endDate: editEndDate,
        reason: editReason.trim(),
        updatedByAdminAt: Date.now(),
      });
      setEditingLeave(null);
      showToast('Leave application updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update leave application.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Filter requests by calendar date if selected
  const displayedRequests = selectedCalendarDate
    ? leaveRequests.filter((req) => {
        if (!req.startDate || !req.endDate) return false;
        return selectedCalendarDate >= req.startDate && selectedCalendarDate <= req.endDate;
      })
    : leaveRequests;

  return (
    <div className="space-y-6">
      {/* 1. INTERACTIVE LEAVE CALENDAR OVERVIEW */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        {/* Calendar Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-wide">
                Staff Leave Calendar Schedule
              </h3>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {monthNames[month]} {year}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => changeMonth(-1)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-slate-200 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={resetToToday}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-slate-200 cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Day Headers (Sun-Sat) */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-500 mb-2">
          <div className="py-1 text-rose-600">Sun</div>
          <div className="py-1">Mon</div>
          <div className="py-1">Tue</div>
          <div className="py-1">Wed</div>
          <div className="py-1">Thu</div>
          <div className="py-1">Fri</div>
          <div className="py-1 text-amber-600">Sat</div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Leading Empty Cells */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-[70px] sm:min-h-[85px] bg-slate-50/50 rounded-xl border border-slate-100 opacity-60"
            />
          ))}

          {/* Days of Current Month */}
          {Array.from({ length: totalDaysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayFormatted = String(day).padStart(2, '0');
            const monthFormatted = String(month + 1).padStart(2, '0');
            const dateStr = `${year}-${monthFormatted}-${dayFormatted}`;

            const isToday = dateStr === todayStr;
            const isSelected = selectedCalendarDate === dateStr;

            // Find overlapping active leaves
            const activeLeaves = leaveRequests.filter((req) => {
              if (!req.startDate || !req.endDate || req.status === 'REJECTED') return false;
              return dateStr >= req.startDate && dateStr <= req.endDate;
            });

            return (
              <div
                key={dateStr}
                onClick={() => handleDateClick(dateStr)}
                className={`min-h-[75px] sm:min-h-[90px] p-1.5 sm:p-2 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : isToday
                    ? 'bg-indigo-50/40 border-indigo-300 shadow-2xs hover:border-indigo-400'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold ${
                      isSelected
                        ? 'text-indigo-700 font-black'
                        : isToday
                        ? 'text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-md'
                        : 'text-slate-600'
                    }`}
                  >
                    {day}
                  </span>
                  {activeLeaves.length > 0 && (
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        activeLeaves.length > 2
                          ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {activeLeaves.length} On Leave
                    </span>
                  )}
                </div>

                {/* Badges of staff on leave */}
                <div className="space-y-1 my-1 overflow-y-auto max-h-[50px] scrollbar-none">
                  {activeLeaves.map((req) => {
                    const isPending = req.status === 'PENDING';
                    const firstName = (req.empName || req.userEmail || 'Staff').split(' ')[0];
                    const typeCode = (req.leaveType || 'LV').slice(0, 2).toUpperCase();

                    return (
                      <div
                        key={req.key}
                        className={`text-[9px] px-1.5 py-0.5 rounded border truncate font-semibold ${
                          isPending
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                        title={`${req.empName} (${req.leaveType}): ${req.reason}`}
                      >
                        <span className="opacity-75 font-mono mr-0.5">[{typeCode}]</span>
                        {firstName}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. LEAVE APPLICATIONS TABLE & CONFLICT AUDIT */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Leave Application Management
            </h3>
            <p className="text-xs text-slate-500">
              Approve, reject, or edit submitted staff leave applications
            </p>
          </div>

          {selectedCalendarDate && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs text-indigo-700">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtering date: <strong>{selectedCalendarDate}</strong></span>
              <button
                onClick={() => setSelectedCalendarDate(null)}
                className="ml-2 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition cursor-pointer"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200 font-semibold tracking-wider">
              <tr>
                <th className="p-3">Applied Date</th>
                <th className="p-3">Staff Member</th>
                <th className="p-3">Leave Type</th>
                <th className="p-3">Leave Dates</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Attachment</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    {selectedCalendarDate
                      ? `No staff leave applications active on ${selectedCalendarDate}.`
                      : 'No leave applications submitted yet.'}
                  </td>
                </tr>
              ) : (
                displayedRequests.map((req) => {
                  const status = req.status || 'PENDING';
                  let statusBadge = 'bg-amber-50 text-amber-800 border-amber-200';
                  if (status === 'APPROVED') {
                    statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  } else if (status === 'REJECTED') {
                    statusBadge = 'bg-rose-50 text-rose-800 border-rose-200';
                  }

                  const currentEmail = (req.userEmail || '').toLowerCase().trim();

                  // Find overlapping requests from other staff
                  const conflictingRequests = leaveRequests.filter((other) => {
                    if (other.key === req.key) return false;
                    const otherEmail = (other.userEmail || '').toLowerCase().trim();
                    if (currentEmail && otherEmail === currentEmail) return false;
                    if (other.status === 'REJECTED') return false;
                    if (!req.startDate || !req.endDate || !other.startDate || !other.endDate) return false;
                    return req.startDate <= other.endDate && req.endDate >= other.startDate;
                  });

                  const totalStaffOnLeave = 1 + conflictingRequests.length;
                  const isHighAbsence = totalStaffOnLeave > 2;

                  return (
                    <tr key={req.key} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {req.appliedAt
                          ? new Date(req.appliedAt).toLocaleDateString()
                          : '--'}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block capitalize">
                          {req.empName || req.userEmail.split('@')[0]}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {req.userEmail}
                        </span>

                        {isHighAbsence && (
                          <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] text-rose-800 font-medium">
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>
                              <strong>High Absence:</strong> {totalStaffOnLeave} staff requesting leave on these dates.
                            </span>
                          </div>
                        )}

                        {(() => {
                          const impact = estimateLeaveRequestImpact(
                            req.userEmail,
                            attendanceLogs,
                            leaveRequests,
                            { startDate: req.startDate, endDate: req.endDate, excludeKey: req.key }
                          );
                          if (impact.unpaidDays === 0) return null;
                          return (
                            <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-medium">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>
                                <strong>Unpaid:</strong> {impact.unpaidDays} day(s) exceed leave balance.
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-3 font-semibold text-indigo-700 text-[11px] uppercase">
                        {req.leaveType}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-700">
                        {req.startDate} to {req.endDate}
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs truncate" title={req.reason}>
                        {req.reason || '--'}
                      </td>
                      <td className="p-3">
                        {req.hasAttachment && req.mcBase64 ? (
                          <button
                            onClick={() =>
                              onViewAttachment(
                                `Medical Certificate: ${req.empName || 'Staff'}`,
                                req.mcBase64 || '',
                                req.mcContentType
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-indigo-700 text-[11px] font-semibold border border-slate-200 inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Paperclip className="w-3 h-3" /> View MC
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${statusBadge}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap space-x-1">
                        {status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveClick(req)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer shadow-xs"
                              title="Approve Leave"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => onUpdateLeaveStatus(req.key, 'REJECTED')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer shadow-xs"
                              title="Reject Leave"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleOpenEdit(req)}
                          className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <PenSquare className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this leave application?')) {
                              onDeleteLeaveRequest(req.key);
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer"
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

      {/* EDIT LEAVE APPLICATION MODAL */}
      {editingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PenSquare className="w-4 h-4 text-indigo-600" />
                <span>Edit Leave Application</span>
              </h3>
              <button
                onClick={() => setEditingLeave(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Staff Selector for swapping */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Staff Member
                </label>
                <select
                  value={editStaffEmail}
                  onChange={(e) => setEditStaffEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                >
                  {staffList.map((s) => (
                    <option key={s.key} value={s.email}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Type & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Leave Type
                  </label>
                  <select
                    value={editLeaveType}
                    onChange={(e) => setEditLeaveType(e.target.value as LeaveType)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="MEDICAL">MEDICAL</option>
                    <option value="ANNUAL">ANNUAL</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                    <option value="OFF DAY">OFF DAY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Status
                  </label>
                  <select
                    value={editLeaveStatus}
                    onChange={(e) => setEditLeaveStatus(e.target.value as LeaveStatus)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="APPROVED">APPROVED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Reason for Leave
                </label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  rows={2}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLeave(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
