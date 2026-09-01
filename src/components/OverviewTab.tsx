import React, { useState, useEffect } from 'react';
import {
  Branch,
  Staff,
  AttendanceLog,
  LeaveRequest,
  PresenceItem,
  ActiveSession,
  TabType,
} from '../types';
import { calculateLeaveBalance } from '../services/leaveBalance';
import {
  Wifi,
  UserCheck,
  CalendarClock,
  Store,
  Signal,
  Zap,
  Users2,
  ArrowUpRight,
  Clock,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface OverviewTabProps {
  presenceData: Record<string, PresenceItem>;
  activeSession: ActiveSession | null;
  attendanceLogs: AttendanceLog[];
  leaveRequests: LeaveRequest[];
  branches: Branch[];
  staffList: Staff[];
  onNavigateTab: (tab: TabType) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  presenceData,
  activeSession,
  attendanceLogs,
  leaveRequests,
  branches,
  staffList,
  onNavigateTab,
}) => {
  const [elapsedDutyTime, setElapsedDutyTime] = useState<string>('00:00:00');

  // Live timer for active duty shift
  useEffect(() => {
    if (!activeSession?.clockInTime) return;

    const timer = setInterval(() => {
      const startMs = typeof activeSession.clockInTime === 'string'
        ? new Date(activeSession.clockInTime).getTime()
        : Number(activeSession.clockInTime);

      if (isNaN(startMs)) {
        setElapsedDutyTime('In Progress');
        return;
      }

      const diffSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      const hours = Math.floor(diffSecs / 3600);
      const mins = Math.floor((diffSecs % 3600) / 60);
      const secs = diffSecs % 60;
      setElapsedDutyTime(
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession]);

  // Counts
  const onlineStaffCount = (Object.values(presenceData || {}) as PresenceItem[]).filter(
    (p) => p.status === 'ONLINE'
  ).length;

  const activeBranchesCount = branches.filter((b) => b.status === 'ACTIVE').length;
  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'PENDING').length;
  const hasActiveShift = !!(activeSession && activeSession.clockInTime);

  // Calculate carried leave balance & unpaid days for a staff email under
  // the new policy: 6 leave/month (4 weekday + 2 weekend), carried forward,
  // deducted per day absent or per day of approved leave, with any usage
  // beyond the available balance flagged as unpaid.
  const calculateStaffMetrics = (userEmail: string) => {
    const result = calculateLeaveBalance(userEmail, attendanceLogs, leaveRequests);
    return {
      weekdayBalance: result.weekdayBalance,
      weekendBalance: result.weekendBalance,
      totalBalance: result.totalBalance,
      unpaidDays: result.unpaidDays,
    };
  };

  // Compile combined staff list for overview
  const combinedStaffList = React.useMemo(() => {
    const map = new Map<string, { name: string; email: string; branch?: string }>();

    staffList.forEach((s) => {
      if (s.email) {
        map.set(s.email.toLowerCase(), {
          name: s.name,
          email: s.email,
          branch: s.branch,
        });
      }
    });

    (Object.values(presenceData || {}) as PresenceItem[]).forEach((p) => {
      if (p.email && !map.has(p.email.toLowerCase())) {
        const fallback = p.name || p.empName || p.email.split('@')[0].replace(/[._-]/g, ' ');
        map.set(p.email.toLowerCase(), {
          name: fallback,
          email: p.email,
        });
      }
    });

    return Array.from(map.values());
  }, [staffList, presenceData]);

  return (
    <div className="space-y-6">
      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div
          onClick={() => onNavigateTab('staff')}
          className="bg-white hover:bg-slate-50/80 border border-slate-200/90 p-5 rounded-2xl transition cursor-pointer group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Online Staff Members</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 group-hover:scale-105 transition">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {onlineStaffCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 group-hover:text-indigo-600 transition">
              View Staff <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-white hover:bg-slate-50/80 border border-slate-200/90 p-5 rounded-2xl transition cursor-pointer group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Active Duty Shifts</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 group-hover:scale-105 transition">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {hasActiveShift ? 1 : 0}
            </span>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 group-hover:text-indigo-600 transition">
              Duty Monitor <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => onNavigateTab('leaves')}
          className="bg-white hover:bg-slate-50/80 border border-slate-200/90 p-5 rounded-2xl transition cursor-pointer group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Pending Leave Requests</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 group-hover:scale-105 transition">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {pendingLeavesCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 group-hover:text-indigo-600 transition">
              Review Leaves <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => onNavigateTab('branches')}
          className="bg-white hover:bg-slate-50/80 border border-slate-200/90 p-5 rounded-2xl transition cursor-pointer group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Active Branches</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 group-hover:scale-105 transition">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {activeBranchesCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 group-hover:text-indigo-600 transition">
              Directory <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Middle Dual Monitor (Live Presence + Active Shift) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Staff Connection Presence */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Signal className="w-4 h-4 text-emerald-600" />
              <span>Live Staff Connection Presence</span>
            </h3>
            <span className="text-[10px] text-slate-600 font-semibold font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              {Object.keys(presenceData || {}).length} Total Tracked
            </span>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {Object.keys(presenceData || {}).length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No staff connection presence stream registered yet.
              </p>
            ) : (
              (Object.entries(presenceData || {}) as [string, PresenceItem][]).map(([uid, item]) => {
                const isOnline = item.status === 'ONLINE';
                const name =
                  item.name ||
                  item.empName ||
                  (item.email ? item.email.split('@')[0].replace(/[._-]/g, ' ') : 'Staff');

                return (
                  <div
                    key={uid}
                    className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-slate-900 font-semibold block capitalize">
                          {name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.email || uid}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                        {item.lastSeen
                          ? new Date(item.lastSeen).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Just now'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          isOnline
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isOnline && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        )}
                        {item.status || 'OFFLINE'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Duty Shift Monitor */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span>Active Duty Session Monitor</span>
            </h3>
            <span className="text-[10px] text-indigo-700 font-semibold font-mono bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              Live Session
            </span>
          </div>

          {hasActiveShift && activeSession ? (
            <div className="p-5 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 border border-indigo-200 rounded-2xl space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {activeSession.empName || 'Staff Member'}
                    </h4>
                    <p className="text-xs text-indigo-600 font-mono font-medium">
                      {activeSession.userEmail || '--'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    ON DUTY
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-200/70">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block font-medium">Clocked In</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {activeSession.clockInTime
                        ? new Date(activeSession.clockInTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '--'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block font-medium">Punctuality</span>
                    <span className="text-xs font-bold text-emerald-700">
                      {activeSession.punctualityStatus || 'ON TIME'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Elapsed Timer Counter */}
              <div className="bg-white border border-indigo-200 p-3.5 rounded-xl flex items-center justify-between shadow-2xs">
                <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" /> Elapsed Shift Time:
                </span>
                <span className="text-lg font-black text-indigo-600 font-mono tracking-wider">
                  {elapsedDutyTime}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-700 font-semibold">No Active Duty Shift in Progress</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                When staff members clock in from the mobile or staff app, live session telemetry appears here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Staff Leave & Off Day Overview Cards */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users2 className="w-4 h-4 text-indigo-600" />
              <span>Staff Leave & Carried Off-Day Ledger</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              6 leave/month (4 weekday + 2 weekend), carried forward. Absences & approved leave
              deduct per day; usage beyond balance is unpaid.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('leaves')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            Leave Calendar <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {combinedStaffList.length === 0 ? (
            <p className="text-xs text-slate-400 col-span-full text-center py-6">
              No staff members registered in directory.
            </p>
          ) : (
            combinedStaffList.map((staff) => {
              const metrics = calculateStaffMetrics(staff.email);

              return (
                <div
                  key={staff.email}
                  className="bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-xl p-3.5 flex items-center justify-between transition shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 capitalize">
                        {staff.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                        {staff.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-semibold">Weekday</p>
                      <span className="text-xs font-mono font-bold text-indigo-600">
                        {metrics.weekdayBalance}/4
                      </span>
                    </div>
                    <div className="border-l border-slate-200 pl-3">
                      <p className="text-[9px] text-slate-400 uppercase font-semibold">Weekend</p>
                      <span className="text-xs font-mono font-bold text-indigo-600">
                        {metrics.weekendBalance}/2
                      </span>
                    </div>
                    <div className="border-l border-slate-200 pl-3">
                      <p className="text-[9px] text-slate-400 uppercase font-semibold">Unpaid</p>
                      <span
                        className={`text-xs font-mono font-bold ${
                          metrics.unpaidDays > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {metrics.unpaidDays}d
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
