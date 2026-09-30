export const runtime = 'edge';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F9FA]">
            <div className="text-center">
                <h1 className="text-6xl font-black text-[#143d30] mb-4">404</h1>
                <p className="text-lg text-gray-500 mb-6">Page not found</p>
                <a
                    href="/"
                    className="bg-[#143d30] hover:bg-[#1a4f3f] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-[0_8px_20px_rgba(20,61,48,0.2)]"
                >
                    Back to Dashboard
                </a>
            </div>
        </div>
    );
}
