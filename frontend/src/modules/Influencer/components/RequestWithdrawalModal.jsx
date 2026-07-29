import { useState } from 'react';
import { FiX, FiDollarSign, FiCreditCard, FiSmartphone, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { requestInfluencerWithdrawal } from '../services/influencerWalletService';

const RequestWithdrawalModal = ({ availableBalance = 0, onClose, onSuccess }) => {
    const [payoutMethod, setPayoutMethod] = useState('upi'); // 'upi' | 'bank'
    const [amount, setAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [bankName, setBankName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const minAmount = 100;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const numAmount = Number(amount);
        if (!numAmount || numAmount < minAmount) {
            toast.error(`Minimum withdrawal amount is ₹${minAmount}.`);
            return;
        }

        if (numAmount > availableBalance) {
            toast.error(`Requested amount exceeds available balance (₹${availableBalance.toLocaleString()}).`);
            return;
        }

        if (payoutMethod === 'upi' && !upiId.trim()) {
            toast.error('Please enter a valid UPI ID.');
            return;
        }

        if (payoutMethod === 'bank') {
            if (!accountHolder.trim() || !accountNumber.trim() || !ifsc.trim() || !bankName.trim()) {
                toast.error('Please fill in all bank account details.');
                return;
            }
        }

        setSubmitting(true);
        try {
            const payload = {
                amount: numAmount,
                upiId: payoutMethod === 'upi' ? upiId.trim() : '',
                bankDetails:
                    payoutMethod === 'bank'
                        ? {
                              accountHolder: accountHolder.trim(),
                              accountNumber: accountNumber.trim(),
                              ifsc: ifsc.trim().toUpperCase(),
                              bankName: bankName.trim(),
                          }
                        : {},
            };

            await requestInfluencerWithdrawal(payload);
            toast.success('Withdrawal request submitted successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to submit withdrawal request.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                            <FiDollarSign className="text-emerald-600" />
                            Request Commission Payout
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Available Balance: <strong className="text-emerald-700 font-bold">₹{availableBalance.toLocaleString()}</strong>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Amount Input */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                            Withdrawal Amount (₹)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min={minAmount}
                                max={availableBalance}
                                placeholder={`Min ₹${minAmount}`}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 font-extrabold text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                            />
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₹</span>
                        </div>
                    </div>

                    {/* Method Selector */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                            Select Payout Method
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPayoutMethod('upi')}
                                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                                    payoutMethod === 'upi'
                                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold shadow-sm'
                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <FiSmartphone className="w-5 h-5 text-emerald-600" />
                                <span className="text-xs">UPI ID</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPayoutMethod('bank')}
                                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                                    payoutMethod === 'bank'
                                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold shadow-sm'
                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <FiCreditCard className="w-5 h-5 text-purple-600" />
                                <span className="text-xs">Bank Transfer</span>
                            </button>
                        </div>
                    </div>

                    {/* UPI Fields */}
                    {payoutMethod === 'upi' && (
                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">UPI ID (e.g. name@upi)</label>
                            <input
                                type="text"
                                placeholder="example@okaxis / mobile@upi"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    )}

                    {/* Bank Fields */}
                    {payoutMethod === 'bank' && (
                        <div className="space-y-3 pt-1">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Account Holder Name</label>
                                <input
                                    type="text"
                                    placeholder="Name as per bank records"
                                    value={accountHolder}
                                    onChange={(e) => setAccountHolder(e.target.value)}
                                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        placeholder="Bank Account Number"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">IFSC Code</label>
                                    <input
                                        type="text"
                                        placeholder="HDFC0001234"
                                        value={ifsc}
                                        onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono uppercase bg-slate-50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Bank Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. State Bank of India"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50"
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                        >
                            <FiCheckCircle className="w-5 h-5" />
                            {submitting ? 'Submitting Request...' : 'Confirm Withdrawal Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestWithdrawalModal;
