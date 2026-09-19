export const DEFAULT_LATE_DEDUCTION_AMOUNT = 100;

export interface LateDeductionInput {
    isLate: boolean;
    status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'UNMARKED' | string;
    dailySalary?: number;
    customDeduction?: number;
}

/**
 * Isolated function to calculate late arrival wage deduction.
 * Standard rule:
 * - If not late or absent or unmarked -> deduction is ₹0.
 * - If late and present/half-day -> configurable deduction amount (default ₹100).
 */
export function calculateLateDeduction({
    isLate,
    status,
    customDeduction,
}: LateDeductionInput): number {
    if (!isLate || status === 'ABSENT' || status === 'UNMARKED') {
        return 0;
    }

    const deduction = customDeduction !== undefined ? customDeduction : DEFAULT_LATE_DEDUCTION_AMOUNT;
    return Math.max(0, deduction);
}

/**
 * Calculates effective daily wage after late deduction.
 */
export function calculateEffectiveDailyWage(
    dailySalary: number,
    status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'UNMARKED' | string,
    lateDeduction: number
): number {
    let baseWage = 0;
    if (status === 'PRESENT') {
        baseWage = dailySalary;
    } else if (status === 'HALF_DAY') {
        baseWage = dailySalary / 2;
    } else {
        return 0;
    }

    return Math.max(0, baseWage - lateDeduction);
}
