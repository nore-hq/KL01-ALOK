'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="bg-[#143d30] hover:bg-[#1a4f3f] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
        >
            <Printer className="w-4 h-4" /> Print Receipt
        </button>
    );
}
