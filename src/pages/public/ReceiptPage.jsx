import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Download, Shield, Building2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const METHOD_LABELS = {
    cash: 'Naqd pul',
    card: 'Bank kartasi',
    transfer: "Bank o'tkazmasi",
    online: 'Online to\'lov',
};

const ReceiptPage = () => {
    const [params] = useSearchParams();

    const txn    = params.get('txn')    || '—';
    const name   = params.get('name')   || '—';
    const group  = params.get('group')  || '—';
    const amount = params.get('amount') || '0';
    const method = params.get('method') || '—';
    const date   = params.get('date')   || '—';
    const month  = params.get('month')  || '—';

    const methodLabel = METHOD_LABELS[method] || method;

    const rows = [
        { label: "O'quvchi",       value: name },
        { label: 'Guruh',          value: group },
        { label: 'To\'lov oyi',    value: month },
        { label: 'To\'lov usuli',  value: methodLabel },
        { label: 'Sana va vaqt',   value: date },
        { label: 'Tranzaksiya ID', value: txn, mono: true },
    ];

    const qrValue = window.location.href;

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
            {/* Card */}
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="bg-gradient-to-br from-[#1e3a8a] to-[#1d4ed8] px-8 pt-8 pb-10 relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                                <Building2 size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white font-black text-sm tracking-widest uppercase">Terra Academy</p>
                                <p className="text-blue-200 text-[9px] font-medium uppercase tracking-widest">O'quv markazi</p>
                            </div>
                        </div>

                        {/* Status badge */}
                        <div className="inline-flex items-center gap-2 bg-emerald-400/20 border border-emerald-400/30 px-3 py-1.5 rounded-full mb-5">
                            <CheckCircle2 size={13} className="text-emerald-300" />
                            <span className="text-emerald-200 text-[10px] font-black uppercase tracking-widest">To'lov tasdiqlandi</span>
                        </div>

                        <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1">Jami to'lov summasi</p>
                        <p className="text-white font-black tracking-tight" style={{ fontSize: 38 }}>
                            {Number(amount).toLocaleString()}
                            <span className="text-blue-200 text-lg ml-2 font-bold">UZS</span>
                        </p>
                    </div>
                </div>

                {/* Zigzag divider */}
                <div className="relative h-4 bg-white overflow-hidden -mt-1">
                    <svg viewBox="0 0 400 16" className="absolute bottom-0 w-full" preserveAspectRatio="none">
                        <path d="M0,16 L0,0 L20,8 L40,0 L60,8 L80,0 L100,8 L120,0 L140,8 L160,0 L180,8 L200,0 L220,8 L240,0 L260,8 L280,0 L300,8 L320,0 L340,8 L360,0 L380,8 L400,0 L400,16 Z" fill="#1d4ed8" />
                    </svg>
                </div>

                {/* Details */}
                <div className="px-6 py-5 space-y-0">
                    {rows.map(({ label, value, mono }, i) => (
                        <div key={label}>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</span>
                                <span className={`text-slate-800 text-sm font-bold text-right max-w-[55%] ${mono ? 'font-mono text-blue-600 text-[11px]' : ''}`}>
                                    {value}
                                </span>
                            </div>
                            {i < rows.length - 1 && <div className="border-t border-dashed border-slate-100" />}
                        </div>
                    ))}
                </div>

                {/* QR section */}
                <div className="mx-6 mb-6 bg-slate-50 rounded-2xl p-5 flex flex-col items-center gap-3 border border-slate-100">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <QRCodeSVG
                            value={qrValue}
                            size={110}
                            level="M"
                            bgColor="#ffffff"
                            fgColor="#0f172a"
                            includeMargin={false}
                        />
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kvitansiya ID</p>
                        <p className="font-mono text-xs font-bold text-slate-700 mt-0.5">{txn}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-2 bg-slate-50 border-t border-slate-100 px-6 py-4">
                    <Shield size={12} className="text-slate-300" />
                    <p className="text-[9px] text-slate-300 font-medium uppercase tracking-widest">
                        Terra Academy rasmiy to'lov tizimi
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ReceiptPage;
