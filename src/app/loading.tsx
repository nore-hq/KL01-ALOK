import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[#143d30] flex items-center justify-center font-black text-white text-xl shadow-lg animate-pulse">
                KL
            </div>
            <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-[#143d30]" />
                Loading workspace...
            </div>
        </div>
    );
}
