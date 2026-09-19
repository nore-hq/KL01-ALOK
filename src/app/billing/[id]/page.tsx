import { getBillById } from '@/app/actions/billing';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import PrintButton from './PrintButton';

export const runtime = 'edge';

export default async function BillDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const bill = await getBillById(resolvedParams.id);

    if (!bill) {
        return notFound();
    }

    const formattedDate = new Date(bill.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Back Navigation & Print Controls (Hidden on Print) */}
            <div className="flex items-center justify-between print:hidden">
                <Link
                    href="/billing"
                    className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Invoices
                </Link>

                <PrintButton />
            </div>

            {/* Print-Friendly Receipt Card */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-[0_12px_40px_rgba(0,0,0,0.04)] print:shadow-none print:border-none print:p-0">
                {/* Header / Branding */}
                <div className="flex items-start justify-between border-b border-gray-200 pb-6 mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-[#143d30] text-white font-black flex items-center justify-center text-lg print:border print:border-black">
                                KL
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">KL-01 CAR SPA</h1>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Premium Auto Detailing & Care</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="inline-block bg-[#143d30] text-white text-xs font-mono font-bold px-3 py-1 rounded-md uppercase tracking-wider print:bg-black">
                            INVOICE
                        </span>
                        <div className="mt-2 text-xl font-bold font-mono text-gray-900">{bill.billNumber}</div>
                        <div className="text-xs text-gray-500 mt-1">{formattedDate}</div>
                    </div>
                </div>

                {/* Customer & Vehicle Info Grid */}
                <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-2xl p-6 mb-8 print:bg-white print:border print:border-gray-200">
                    <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Customer Details</span>
                        <div className="text-base font-bold text-gray-900">{bill.customerName}</div>
                    </div>

                    <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Vehicle Info</span>
                        <div className="text-base font-bold text-gray-900">{bill.vehicleModel}</div>
                        <div className="text-sm font-mono uppercase text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200 inline-block mt-1 font-semibold">
                            {bill.vehicleNumber}
                        </div>
                    </div>
                </div>

                {/* Service Details Table */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden mb-8">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100/70 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600 font-bold">
                            <tr>
                                <th className="p-4">Service Description</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="p-4 font-medium text-gray-900">
                                    <div className="font-semibold text-base">{bill.service}</div>
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-base text-gray-900">
                                    ₹{bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Total & Payment Summary */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-gray-200">
                    <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Payment Method</span>
                        <div className="text-sm font-bold text-gray-900 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-lg border border-gray-200 inline-block">
                            {bill.paymentMode.replace('_', ' ')}
                        </div>
                    </div>

                    <div className="text-right w-full sm:w-auto bg-gray-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Paid</div>
                        <div className="text-3xl font-black text-[#143d30] font-mono">
                            ₹{bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                {/* Receipt Footer */}
                <div className="mt-12 pt-6 border-t border-dashed border-gray-200 text-center text-xs text-gray-400">
                    Thank you for choosing KL-01 Car Spa! Drive clean and safe.
                </div>
            </div>
        </div>
    );
}
