import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// System Users (Admins/Managers) Table
export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: ['ADMIN', 'MANAGER'] }).default('MANAGER').notNull(),
    createdAt: text('created_at').notNull(),
});

// Employees Master Table
export const employees = sqliteTable('employees', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    age: integer('age').notNull(),
    phone: text('phone').notNull(),
    position: text('position', { enum: ['MECHANIC', 'CLEANER', 'MANAGER', 'RECEPTIONIST'] }).notNull(),
    dailySalary: real('daily_salary').notNull(),
    status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).default('ACTIVE').notNull(),
    createdAt: text('created_at').notNull(),
});

// Daily Attendance Records Table
export const attendance = sqliteTable('attendance', {
    id: text('id').primaryKey(),
    employeeId: text('employee_id').references(() => employees.id).notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    status: text('status', { enum: ['PRESENT', 'ABSENT', 'HALF_DAY'] }).notNull(),
    isLate: integer('is_late', { mode: 'boolean' }).default(false).notNull(),
    overtimeHours: real('overtime_hours').default(0).notNull(),
    notes: text('notes'),
});

// Advance Salary Payments Log Table
export const salaryAdvances = sqliteTable('salary_advances', {
    id: text('id').primaryKey(),
    employeeId: text('employee_id').references(() => employees.id).notNull(),
    amount: real('amount').notNull(),
    datePaid: text('date_paid').notNull(), // YYYY-MM-DD
    notes: text('notes'),
});