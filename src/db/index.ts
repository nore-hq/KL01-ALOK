/// <reference types="@cloudflare/workers-types" />
import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

export function getDb() {
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

    if (!d1Instance) {
        throw new Error('D1 Binding "DB" not detected. Ensure wrangler.toml exists and Cloudflare dev platform is active.');
    }

    return drizzle(d1Instance);
}