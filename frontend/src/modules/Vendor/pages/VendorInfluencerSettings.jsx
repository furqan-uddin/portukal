import { useState, useEffect } from 'react';
import {
    FiAward,
    FiCheckCircle,
    FiPercent,
    FiSliders,
    FiInfo,
    FiSave,
    FiAlertTriangle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
    getVendorInfluencerSettings,
    updateVendorInfluencerSettings,
} from '../../Influencer/services/influencerMarketplaceService';

const VendorInfluencerSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [enabled, setEnabled] = useState(true);
    const [defaultCommissionPercent, setDefaultCommissionPercent] = useState(5);
    const [allowProductOverride, setAllowProductOverride] = useState(true);
    const [adminLimits, setAdminLimits] = useState({
        minCommissionPercent: 2,
        maxCommissionPercent: 20,
        isEnabled: true,
    });

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await getVendorInfluencerSettings();
            const data = res?.data || res;
            if (data.influencerProgram) {
                setEnabled(data.influencerProgram.enabled !== false);
                setDefaultCommissionPercent(data.influencerProgram.defaultCommissionPercent || 5);
                setAllowProductOverride(data.influencerProgram.allowProductOverride !== false);
            }
            if (data.adminLimits) {
                setAdminLimits(data.adminLimits);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to fetch settings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (adminLimits.isEnabled === false) {
            toast.error('Admin has globally disabled the influencer program.');
            return;
        }

        const commNum = Number(defaultCommissionPercent);
        if (commNum < adminLimits.minCommissionPercent || commNum > adminLimits.maxCommissionPercent) {
            toast.error(
                `Commission percentage must be within Admin bounds (${adminLimits.minCommissionPercent}% to ${adminLimits.maxCommissionPercent}%).`
            );
            return;
        }

        setSaving(true);
        try {
            await updateVendorInfluencerSettings({
                enabled,
                defaultCommissionPercent: commNum,
                allowProductOverride,
            });
            toast.success('Influencer program settings saved successfully!');
            fetchSettings();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-400 text-sm">Loading Influencer Program Settings...</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiAward className="text-purple-600" />
                        Influencer Program Settings
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Configure your store's default commission rate and enable creators to promote your products.
                    </p>
                </div>
            </div>

            {/* Admin Program Disabled Warning Banner */}
            {adminLimits.isEnabled === false && (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                    <FiAlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold block mb-0.5">Global Program Notice</span>
                        The Influencer Affiliate Program is currently paused by Platform Admin. Vendor settings are read-only until Admin re-enables the program.
                    </div>
                </div>
            )}

            {/* Admin Limits Notice */}
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 flex items-start gap-3 text-xs text-purple-900">
                <FiInfo className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold block mb-0.5">Marketplace Commission Bounds Policy</span>
                    Platform Admin enforces commission rates between{' '}
                    <strong className="font-mono text-purple-700">{adminLimits.minCommissionPercent}%</strong> and{' '}
                    <strong className="font-mono text-purple-700">{adminLimits.maxCommissionPercent}%</strong>. All rates configured below are validated against these bounds.
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                {/* Enable Program Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">Enable Influencer Promotion</h4>
                        <p className="text-xs text-slate-500">Allow approved creators on Porutkal to list your products in the Influencer Marketplace.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={enabled}
                            disabled={adminLimits.isEnabled === false}
                            onChange={(e) => setEnabled(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>

                {/* Default Commission Percent */}
                <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Default Influencer Commission Rate (%)
                    </label>
                    <div className="relative max-w-xs">
                        <input
                            type="number"
                            min={adminLimits.minCommissionPercent}
                            max={adminLimits.maxCommissionPercent}
                            step="0.5"
                            disabled={adminLimits.isEnabled === false}
                            value={defaultCommissionPercent}
                            onChange={(e) => setDefaultCommissionPercent(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        <FiPercent className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Allowed bounds: {adminLimits.minCommissionPercent}% to {adminLimits.maxCommissionPercent}%.
                    </p>
                </div>

                {/* Allow Product Override */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">Allow Per-Product Commission Overrides</h4>
                        <p className="text-xs text-slate-500">When enabled, you can customize specific commission rates for individual products in the product form.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={allowProductOverride}
                            disabled={adminLimits.isEnabled === false}
                            onChange={(e) => setAllowProductOverride(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving || adminLimits.isEnabled === false}
                        className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiSave className="w-4 h-4" /> {saving ? 'Saving Settings...' : 'Save Influencer Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VendorInfluencerSettings;
