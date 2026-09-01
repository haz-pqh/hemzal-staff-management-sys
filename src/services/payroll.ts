import { SMEPayrollBreakdown, StaffPosition } from '../types';

export const POSITION_BASE_SALARIES: Record<StaffPosition, number> = {
  MANAGER: 3500.0,
  SUPERVISOR: 2500.0,
  SENIOR_CREW: 2000.0,
  CREW: 1700.0,
};

export const POSITION_LABELS: Record<StaffPosition, string> = {
  MANAGER: 'Branch Manager (RM 3,500)',
  SUPERVISOR: 'Supervisor (RM 2,500)',
  SENIOR_CREW: 'Senior Kitchen / Service Crew (RM 2,000)',
  CREW: 'Kitchen / Service Crew (RM 1,700)',
};

/**
 * Calculates SME Malaysia statutory deductions (Employment Act 1955 standard basis)
 * @param basicSalary Base monthly salary in MYR
 * @param absentDays Number of UNPAID days in the pay period - this covers both
 *   unexcused absences and any approved leave (Annual/Medical/Emergency/Off Day)
 *   taken beyond the staff member's available leave balance for that period
 *   (see services/leaveBalance.ts)
 * @param presentDays Number of recorded present days
 * @param totalWorkingDays Standard monthly working days baseline (26 days)
 */
export function calculateSMEPayroll(
  basicSalary: number,
  absentDays: number = 0,
  presentDays: number = 0,
  totalWorkingDays: number = 26
): SMEPayrollBreakdown {
  const dailyRate = basicSalary / totalWorkingDays;
  const absentDeduction = Math.round(absentDays * dailyRate * 100) / 100;
  const grossSalary = Math.max(0, Math.round((basicSalary - absentDeduction) * 100) / 100);

  // KWSP / EPF Employee Contribution (11% on gross earnings)
  const epfEmployee = Math.round(grossSalary * 0.11 * 100) / 100;

  // PERKESO / SOCSO Employee Contribution (0.5% capped at RM 5,000 salary ceiling)
  const socsoCap = Math.min(grossSalary, 5000);
  const socsoEmployee = Math.round(socsoCap * 0.005 * 100) / 100;

  // SIP / EIS Employee Contribution (0.2% capped at RM 5,000 salary ceiling)
  const eisCap = Math.min(grossSalary, 5000);
  const eisEmployee = Math.round(eisCap * 0.002 * 100) / 100;

  const totalDeductions = Math.round((epfEmployee + socsoEmployee + eisEmployee) * 100) / 100;
  const netSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);

  return {
    basicSalary,
    absentDays,
    presentDays,
    dailyRate,
    absentDeduction,
    grossSalary,
    epfEmployee,
    socsoEmployee,
    eisEmployee,
    totalDeductions,
    netSalary,
  };
}
