import { AttendanceLog, LeaveRequest } from '../types';

/**
 * NEW LEAVE POLICY
 * -----------------
 * - Every new calendar month, staff are granted 6 leave days:
 *     4 "weekday" leave (usable Mon-Fri) + 2 "weekend" leave (usable Sat/Sun).
 * - Unused leave carries forward to the next month (no monthly reset/cap).
 * - Every day a staff member is ABSENT, 1 day is deducted from the matching
 *   pool (weekday pool if the absence fell on Mon-Fri, weekend pool if it
 *   fell on Sat/Sun).
 * - Every day of an APPROVED leave application (Annual / Medical / Emergency
 *   / Off Day) deducts 1 day from the matching pool the same way.
 * - Once a pool reaches 0, any further day taken from that pool cannot be
 *   paid for out of the leave allowance - it becomes UNPAID LEAVE and must
 *   be deducted from the staff member's payslip.
 */

export const MONTHLY_WEEKDAY_LEAVE = 4;
export const MONTHLY_WEEKEND_LEAVE = 2;
export const MONTHLY_TOTAL_LEAVE = MONTHLY_WEEKDAY_LEAVE + MONTHLY_WEEKEND_LEAVE;

const MAX_LOOKBACK_MONTHS = 24; // safety cap so dirty/very old data can't cause runaway loops

export interface LeaveBalanceResult {
  weekdayBalance: number;
  weekendBalance: number;
  totalBalance: number;
  weekdayUsed: number;
  weekendUsed: number;
  unpaidWeekdayDays: number;
  unpaidWeekendDays: number;
  unpaidDays: number;
  monthsAccrued: number;
  periodStart: string; // 'YYYY-MM' - first month included in the accrual
}

export interface LeavePeriodResult {
  openingWeekdayBalance: number;
  openingWeekendBalance: number;
  openingTotalBalance: number;
  weekdayUsed: number;
  weekendUsed: number;
  unpaidWeekdayDays: number;
  unpaidWeekendDays: number;
  unpaidDays: number;
  closingWeekdayBalance: number;
  closingWeekendBalance: number;
  closingTotalBalance: number;
}

export interface LeaveRequestImpact {
  requestedDays: number;
  weekdayDays: number;
  weekendDays: number;
  unpaidDays: number;
  weekdayShortfall: number;
  weekendShortfall: number;
  availableWeekdayBalance: number;
  availableWeekendBalance: number;
}

interface DeductionDay {
  date: string; // 'YYYY-MM-DD'
  weekend: boolean;
}

const toDateKey = (d: Date): string => d.toISOString().split('T')[0];

const parseDateKey = (dateStr: string): Date => new Date(`${dateStr}T00:00:00`);

const isWeekendDate = (d: Date): boolean => {
  const day = d.getDay();
  return day === 0 || day === 6;
};

const addDays = (dateStr: string, delta: number): string => {
  const d = parseDateKey(dateStr);
  d.setDate(d.getDate() + delta);
  return toDateKey(d);
};

const monthKeyOf = (dateStr: string): string => dateStr.slice(0, 7);

/** Expand an (inclusive) date range into individual day strings. Capped at 366 days for safety. */
function expandDateRange(start?: string, end?: string): string[] {
  if (!start || !end || start > end) return [];
  const days: string[] = [];
  let cur = start;
  let guard = 0;
  while (cur <= end && guard < 366) {
    days.push(cur);
    cur = addDays(cur, 1);
    guard++;
  }
  return days;
}

/**
 * Builds the sorted, deduplicated list of "leave-consuming" days for a staff
 * member up to (and including) `uptoDateKey`. Approved leave application
 * days take priority over an ABSENT attendance record on the same date, so a
 * day is never double-deducted.
 */
function buildDeductionDays(
  userEmail: string,
  attendanceLogs: AttendanceLog[],
  leaveRequests: LeaveRequest[],
  uptoDateKey: string
): DeductionDay[] {
  const email = (userEmail || '').toLowerCase().trim();
  if (!email) return [];

  const leaveDays = new Set<string>();
  leaveRequests
    .filter((r) => (r.userEmail || '').toLowerCase().trim() === email && r.status === 'APPROVED')
    .forEach((r) => {
      expandDateRange(r.startDate, r.endDate).forEach((d) => {
        if (d <= uptoDateKey) leaveDays.add(d);
      });
    });

  const absentDays = new Set<string>();
  attendanceLogs
    .filter((l) => (l.userEmail || '').toLowerCase().trim() === email)
    .forEach((l) => {
      const status = (l.punctualityStatus || '').toUpperCase().trim();
      const d = l.date;
      if (status === 'ABSENT' && d && d <= uptoDateKey && !leaveDays.has(d)) {
        absentDays.add(d);
      }
    });

  const days: DeductionDay[] = [];
  leaveDays.forEach((date) => days.push({ date, weekend: isWeekendDate(parseDateKey(date)) }));
  absentDays.forEach((date) => days.push({ date, weekend: isWeekendDate(parseDateKey(date)) }));
  days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return days;
}

/** Generates consecutive 'YYYY-MM' month keys from `startMonthKey` through `endMonthKey` inclusive. */
function monthRange(startMonthKey: string, endMonthKey: string): string[] {
  const keys: string[] = [];
  const cursor = new Date(`${startMonthKey}-01T00:00:00`);
  const endDate = new Date(`${endMonthKey}-01T00:00:00`);
  let guard = 0;
  while (cursor <= endDate && guard < MAX_LOOKBACK_MONTHS + 1) {
    keys.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor.setMonth(cursor.getMonth() + 1);
    guard++;
  }
  return keys;
}

/**
 * Cumulative leave balance for a staff member, carried forward from the
 * earliest known attendance/leave record through `referenceDate` (defaults
 * to today). Balances never go below 0 - once a pool is exhausted, further
 * usage is tracked separately as unpaid days rather than a negative balance.
 */
export function calculateLeaveBalance(
  userEmail: string,
  attendanceLogs: AttendanceLog[],
  leaveRequests: LeaveRequest[],
  referenceDate: Date = new Date()
): LeaveBalanceResult {
  const refKey = toDateKey(referenceDate);
  const refMonthKey = monthKeyOf(refKey);

  const email = (userEmail || '').toLowerCase().trim();
  if (!email) {
    return {
      weekdayBalance: 0,
      weekendBalance: 0,
      totalBalance: 0,
      weekdayUsed: 0,
      weekendUsed: 0,
      unpaidWeekdayDays: 0,
      unpaidWeekendDays: 0,
      unpaidDays: 0,
      monthsAccrued: 0,
      periodStart: refMonthKey,
    };
  }

  const deductionDays = buildDeductionDays(email, attendanceLogs, leaveRequests, refKey);

  let startMonthKey = refMonthKey;
  if (deductionDays.length > 0) {
    const earliestMonth = monthKeyOf(deductionDays[0].date);
    if (earliestMonth < startMonthKey) startMonthKey = earliestMonth;
  }

  // Cap lookback so a bad/very old record can't blow up the loop
  const monthsBetween =
    (Number(refMonthKey.slice(0, 4)) - Number(startMonthKey.slice(0, 4))) * 12 +
    (Number(refMonthKey.slice(5, 7)) - Number(startMonthKey.slice(5, 7)));
  if (monthsBetween > MAX_LOOKBACK_MONTHS) {
    const capped = new Date(`${refMonthKey}-01T00:00:00`);
    capped.setMonth(capped.getMonth() - MAX_LOOKBACK_MONTHS);
    startMonthKey = `${capped.getFullYear()}-${String(capped.getMonth() + 1).padStart(2, '0')}`;
  }

  const monthKeys = monthRange(startMonthKey, refMonthKey);

  let weekdayBalance = 0;
  let weekendBalance = 0;
  let weekdayUsed = 0;
  let weekendUsed = 0;
  let unpaidWeekdayDays = 0;
  let unpaidWeekendDays = 0;

  let idx = 0;
  monthKeys.forEach((mKey) => {
    // Every new month, staff receive a fresh 4 weekday + 2 weekend leave,
    // stacked on top of whatever carried over from the prior month.
    weekdayBalance += MONTHLY_WEEKDAY_LEAVE;
    weekendBalance += MONTHLY_WEEKEND_LEAVE;

    while (idx < deductionDays.length && monthKeyOf(deductionDays[idx].date) === mKey) {
      const day = deductionDays[idx];
      if (day.weekend) {
        if (weekendBalance >= 1) {
          weekendBalance -= 1;
          weekendUsed += 1;
        } else {
          unpaidWeekendDays += 1;
        }
      } else if (weekdayBalance >= 1) {
        weekdayBalance -= 1;
        weekdayUsed += 1;
      } else {
        unpaidWeekdayDays += 1;
      }
      idx++;
    }
  });

  return {
    weekdayBalance,
    weekendBalance,
    totalBalance: weekdayBalance + weekendBalance,
    weekdayUsed,
    weekendUsed,
    unpaidWeekdayDays,
    unpaidWeekendDays,
    unpaidDays: unpaidWeekdayDays + unpaidWeekendDays,
    monthsAccrued: monthKeys.length,
    periodStart: startMonthKey,
  };
}

/**
 * Balance and usage scoped to a single pay period (a 'YYYY-MM' month) - used
 * to work out how many days in that specific month must be treated as
 * unpaid on the payslip. The "opening" balance is whatever carried over
 * from all prior months.
 */
export function calculateLeaveBalanceForPeriod(
  userEmail: string,
  attendanceLogs: AttendanceLog[],
  leaveRequests: LeaveRequest[],
  periodKey: string
): LeavePeriodResult {
  const periodStart = `${periodKey}-01`;
  const dayBeforePeriod = addDays(periodStart, -1);
  const email = (userEmail || '').toLowerCase().trim();

  // Opening balance = whatever carried over from all prior recorded months.
  // If there is no recorded absence/leave activity before this period at
  // all, there is nothing to carry in - starting from a synthetic prior
  // month here would fabricate an accrual that never happened, so opening
  // balance is 0 in that case.
  const priorDeductions = buildDeductionDays(email, attendanceLogs, leaveRequests, dayBeforePeriod);
  let openingWeekday = 0;
  let openingWeekend = 0;
  if (priorDeductions.length > 0) {
    const opening = calculateLeaveBalance(
      userEmail,
      attendanceLogs,
      leaveRequests,
      parseDateKey(dayBeforePeriod)
    );
    openingWeekday = opening.weekdayBalance;
    openingWeekend = opening.weekendBalance;
  }

  const lastDayOfPeriod = toDateKey(
    new Date(new Date(`${periodStart}T00:00:00`).getFullYear(), new Date(`${periodStart}T00:00:00`).getMonth() + 1, 0)
  );

  const allDeductions = buildDeductionDays(email, attendanceLogs, leaveRequests, lastDayOfPeriod);
  const periodDeductions = allDeductions.filter((d) => monthKeyOf(d.date) === periodKey);

  let weekdayBalance = openingWeekday + MONTHLY_WEEKDAY_LEAVE;
  let weekendBalance = openingWeekend + MONTHLY_WEEKEND_LEAVE;
  let weekdayUsed = 0;
  let weekendUsed = 0;
  let unpaidWeekdayDays = 0;
  let unpaidWeekendDays = 0;

  periodDeductions.forEach((day) => {
    if (day.weekend) {
      if (weekendBalance >= 1) {
        weekendBalance -= 1;
        weekendUsed += 1;
      } else {
        unpaidWeekendDays += 1;
      }
    } else if (weekdayBalance >= 1) {
      weekdayBalance -= 1;
      weekdayUsed += 1;
    } else {
      unpaidWeekdayDays += 1;
    }
  });

  return {
    openingWeekdayBalance: openingWeekday,
    openingWeekendBalance: openingWeekend,
    openingTotalBalance: openingWeekday + openingWeekend,
    weekdayUsed,
    weekendUsed,
    unpaidWeekdayDays,
    unpaidWeekendDays,
    unpaidDays: unpaidWeekdayDays + unpaidWeekendDays,
    closingWeekdayBalance: weekdayBalance,
    closingWeekendBalance: weekendBalance,
    closingTotalBalance: weekdayBalance + weekendBalance,
  };
}

/**
 * Estimates the impact of applying/approving a candidate leave request
 * (given the staff member's balance as it stood right before the request's
 * start date), so the admin can be warned when a request would exceed the
 * available balance and therefore be unpaid.
 */
export function estimateLeaveRequestImpact(
  userEmail: string,
  attendanceLogs: AttendanceLog[],
  leaveRequests: LeaveRequest[],
  candidate: { startDate: string; endDate: string; excludeKey?: string }
): LeaveRequestImpact {
  const otherLeaves = candidate.excludeKey
    ? leaveRequests.filter((r) => r.key !== candidate.excludeKey)
    : leaveRequests;

  const dayBeforeStart = addDays(candidate.startDate, -1);
  const before = calculateLeaveBalance(
    userEmail,
    attendanceLogs,
    otherLeaves,
    parseDateKey(dayBeforeStart)
  );

  const days = expandDateRange(candidate.startDate, candidate.endDate);
  let weekdayDays = 0;
  let weekendDays = 0;
  days.forEach((d) => {
    if (isWeekendDate(parseDateKey(d))) weekendDays += 1;
    else weekdayDays += 1;
  });

  const weekdayShortfall = Math.max(0, weekdayDays - Math.max(0, before.weekdayBalance));
  const weekendShortfall = Math.max(0, weekendDays - Math.max(0, before.weekendBalance));

  return {
    requestedDays: days.length,
    weekdayDays,
    weekendDays,
    unpaidDays: weekdayShortfall + weekendShortfall,
    weekdayShortfall,
    weekendShortfall,
    availableWeekdayBalance: before.weekdayBalance,
    availableWeekendBalance: before.weekendBalance,
  };
}
