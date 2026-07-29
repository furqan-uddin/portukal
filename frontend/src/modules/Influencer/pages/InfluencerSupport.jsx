import { useState } from 'react';
import {
    FiHelpCircle,
    FiMessageSquare,
    FiSend,
    FiMail,
    FiFileText,
    FiDollarSign,
    FiCheckCircle,
    FiClock,
    FiChevronRight,
    FiBookOpen,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const InfluencerSupport = () => {
    const [activeTab, setActiveTab] = useState('faq'); // 'faq' | 'ticket'
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('commission');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [tickets, setTickets] = useState([
        {
            id: 'TICK-9482',
            subject: 'Question regarding monthly commission payout cycle',
            category: 'Settlement & Wallet',
            status: 'resolved',
            createdAt: '2026-07-25',
            replies: [
                { sender: 'Admin Support', text: 'Commission settlements are released automatically every 30 days after the order return window closes.', time: '2026-07-25 14:20' }
            ]
        }
    ]);

    const handleSubmitTicket = (e) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            toast.error('Please enter a subject and message.');
            return;
        }

        setSubmitting(true);
        setTimeout(() => {
            const newTicket = {
                id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
                subject,
                category: category === 'commission' ? 'Settlement & Wallet' : category === 'link' ? 'Affiliate Links' : 'General Query',
                status: 'pending',
                createdAt: new Date().toISOString().split('T')[0],
                replies: [{ sender: 'You', text: message, time: new Date().toLocaleTimeString() }],
            };
            setTickets([newTicket, ...tickets]);
            setSubject('');
            setMessage('');
            setSubmitting(false);
            toast.success('Support ticket submitted successfully! Our team will respond shortly.');
            setActiveTab('ticket');
        }, 600);
    };

    const faqs = [
        {
            q: 'How are affiliate commissions calculated?',
            a: 'Commissions are calculated as a percentage of the net order value placed using your unique affiliate links or referral code.',
        },
        {
            q: 'When are commission funds released to my Available Balance?',
            a: 'Commissions are initially reserved in Pending status and released to Available Balance automatically after the customer return window (default 7 days) expires.',
        },
        {
            q: 'What is the minimum withdrawal amount?',
            a: 'The minimum withdrawal limit is ₹100. Requests are processed directly to your registered bank account via IMPS/NEFT settlement.',
        },
        {
            q: 'What happens if a customer returns or cancels an order?',
            a: 'If an order is returned or refunded before the return window closes, the reserved pending commission for that order is adjusted automatically.',
        },
        {
            q: 'How do I share affiliate links on social media?',
            a: 'Go to "My Affiliate Links", click "Generate Link" for any marketplace product, and copy your link to share on Instagram, YouTube, or Facebook.',
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiHelpCircle className="text-purple-600" />
                        Creator Support & Knowledge Base
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Need assistance with affiliate links, commission settlements, or payouts? We are here to help 24/7.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setActiveTab('faq')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'faq' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <FiBookOpen className="inline mr-1.5" /> FAQs & Guides
                    </button>
                    <button
                        onClick={() => setActiveTab('ticket')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'ticket' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <FiMessageSquare className="inline mr-1.5" /> Support Tickets ({tickets.length})
                    </button>
                </div>
            </div>

            {/* Content Tabs */}
            {activeTab === 'faq' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* FAQ List */}
                    <div className="md:col-span-2 space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <FiFileText className="text-purple-600" /> Frequently Asked Questions
                        </h2>

                        <div className="space-y-3">
                            {faqs.map((faq, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                                            {idx + 1}
                                        </span>
                                        {faq.q}
                                    </h3>
                                    <p className="text-xs text-slate-600 pl-7 leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Create Ticket Box */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <FiMessageSquare className="text-purple-600" /> Contact Support Team
                        </h3>
                        <p className="text-xs text-slate-500">
                            Have a specific query about an order, custom commission rate, or withdrawal status? Submit a ticket below.
                        </p>

                        <form onSubmit={handleSubmitTicket} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Topic Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="commission">Commission & Settlement</option>
                                    <option value="link">Affiliate Link / Referral Code</option>
                                    <option value="wallet">Withdrawal Payout</option>
                                    <option value="other">General Inquiry</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Subject</label>
                                <input
                                    type="text"
                                    placeholder="Brief summary of your query..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Message</label>
                                <textarea
                                    rows={4}
                                    placeholder="Describe your issue or request in detail..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                            >
                                <FiSend className="w-3.5 h-3.5" /> Submit Support Ticket
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                /* Tickets List */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <h2 className="text-lg font-bold text-slate-900">Your Support Tickets</h2>

                    {tickets.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 font-medium">No support tickets submitted yet.</div>
                    ) : (
                        <div className="space-y-4">
                            {tickets.map((t) => (
                                <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-xs text-purple-700">{t.id}</span>
                                            <span className="font-bold text-slate-900 text-sm">{t.subject}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                                                {t.category}
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                                t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {t.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Replies */}
                                    <div className="space-y-2">
                                        {t.replies.map((r, rIdx) => (
                                            <div key={rIdx} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                                                <div className="flex justify-between text-[11px] text-slate-500 font-bold">
                                                    <span>{r.sender}</span>
                                                    <span>{r.time}</span>
                                                </div>
                                                <p className="text-slate-800 font-medium">{r.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InfluencerSupport;
