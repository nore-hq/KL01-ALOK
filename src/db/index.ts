/// <reference types="@cloudflare/workers-types" />
import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

export function getRawD1(): D1Database | undefined {
    let d1Instance: D1Database | undefined;

    // 1. Try Request Context (Cloudflare Pages / next-dev platform)
    try {
        const ctx = getRequestContext();
        const env = ctx?.env as any;
        if (env?.DB) d1Instance = env.DB;
    } catch (err) {
        // Ignored, try fallbacks
    }

    // 2. Try Node Process Env / Global (Standard Local Dev / Miniflare)
    if (!d1Instance && typeof process !== 'undefined' && (process.env as any).DB) {
        d1Instance = (process.env as any).DB;
    }

    if (!d1Instance && typeof globalThis !== 'undefined') {
        const globalEnv = (globalThis as any).__env__ || (globalThis as any).MINIFLARE_BINDINGS;
        if (globalEnv?.DB) d1Instance = globalEnv.DB;
    }

    return d1Instance;
}

export function getDb() {
    const d1Instance = getRawD1();

    if (!d1Instance) {
        throw new Error('D1 Binding "DB" not detected. Ensure Cloudflare Pages has the D1 database binding "DB" attached in dashboard settings.');
    }

    return drizzle(d1Instance);
}

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'MANAGER' NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    phone TEXT NOT NULL,
    position TEXT NOT NULL,
    daily_salary REAL NOT NULL,
    status TEXT DEFAULT 'ACTIVE' NOT NULL,
    created_at TEXT NOT NULL,
    partner_id TEXT REFERENCES partners(id)
);
CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES employees(id),
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    is_late INTEGER DEFAULT 0 NOT NULL,
    late_deduction REAL DEFAULT 0 NOT NULL,
    overtime_pay REAL DEFAULT 0 NOT NULL,
    notes TEXT,
    timestamp TEXT
);
CREATE TABLE IF NOT EXISTS salary_advances (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES employees(id),
    amount REAL NOT NULL,
    date_paid TEXT NOT NULL,
    notes TEXT
);
CREATE TABLE IF NOT EXISTS billing (
    id TEXT PRIMARY KEY,
    serial_number INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    vehicle_number TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    service_type TEXT NOT NULL,
    payment_mode TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    partner_id TEXT REFERENCES partners(id)
);
INSERT INTO users (id, email, password_hash, role, created_at)
VALUES ('admin_root', 'adminkl@kl.com', '$2b$10$264mx1okYobSqYYOY1hQgevT0hApB4ILXlQLTS2kRY3tJ2Bu1JlU6', 'ADMIN', '2026-10-09T13:30:22.465Z')
ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash;
`;

let isInitialized = false;

export async function ensureDbInitialized() {
    if (isInitialized) return;
    const rawD1 = getRawD1();
    if (rawD1 && typeof rawD1.exec === 'function') {
        try {
            await rawD1.exec(INIT_SQL);
            isInitialized = true;
        } catch (err) {
            console.error('ensureDbInitialized warning:', err);
        }
    }
}