import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiFilm, FiX, FiCheck, FiArrowLeft, FiArrowRight, FiTag, FiSearch } from 'react-icons/fi';
import api from '../../../../shared/utils/api';
import toast from 'react-hot-toast';

const STEPS = ['Upload Video', 'Add Details', 'Tag Products', 'Preview & Submit'];

const VendorReelUpload = () => {
    const navigate = useNavigate();
    const videoInputRef = useRef();
    const [step, setStep] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [uploadedReel, setUploadedReel] = useState(null);

    // Step 1: Video
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState('');

    // Step 2: Details
    const [details, setDetails] = useState({ title: '', description: '', caption: '', category: '', tags: '', visibility: 'public' });

    // Step 3: Tagged products
    const [productSearch, setProductSearch] = useState('');
    const [productResults, setProductResults] = useState([]);
    const [taggedProducts, setTaggedProducts] = useState([]);
    const [searching, setSearching] = useState(false);

    const CATEGORIES = ['Fashion', 'Beauty', 'Electronics', 'Home & Living', 'Sports', 'Food', 'Accessories', 'Health'];

    const handleVideoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only MP4, MOV, AVI, and WebM videos are accepted.');
            return;
        }
        if (file.size > 200 * 1024 * 1024) {
            toast.error('Video file must be under 200MB.');
            return;
        }
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
    };

    const searchProducts = useCallback(async (q) => {
        if (!q || q.length < 2) { setProductResults([]); return; }
        setSearching(true);
        try {
            const data = await api.get('/vendor/products', { params: { search: q, limit: 10 } });
            setProductResults(data.products || data || []);
        } catch { setProductResults([]); } finally { setSearching(false); }
    }, []);

    const toggleProduct = (product) => {
        setTaggedProducts((prev) => {
            const exists = prev.find((p) => p.productId === product._id);
            if (exists) return prev.filter((p) => p.productId !== product._id);
            if (prev.length >= 5) { toast.error('Maximum 5 products per reel.'); return prev; }
            return [...prev, { productId: product._id, label: `₹${product.price} · ${product.name}`, position: prev.length }];
        });
    };

    const uploadVideo = async () => {
        if (!videoFile) { toast.error('Please select a video file.'); return; }
        if (!details.title.trim()) { toast.error('Please add a title before uploading.'); return; }
        setUploading(true);
        setProgress(0);
        try {
            const formData = new FormData();
            formData.append('video', videoFile);
            formData.append('title', details.title.trim());
            formData.append('description', details.description.trim());
            formData.append('caption', details.caption.trim());
            formData.append('category', details.category);
            formData.append('tags', details.tags);
            formData.append('visibility', details.visibility);
            if (taggedProducts.length > 0) formData.append('taggedProducts', JSON.stringify(taggedProducts));

            const response = await api.post('/vendor/reels/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => { setProgress(Math.round((e.loaded / e.total) * 100)); },
            });
            setUploadedReel(response);
            toast.success('Reel uploaded successfully!');
            setStep(3);
        } catch { toast.error('Upload failed. Please try again.'); } finally { setUploading(false); }
    };

    const handleSubmitForReview = async () => {
        if (!uploadedReel?._id) return;
        setSubmitting(true);
        try {
            await api.patch(`/vendor/reels/${uploadedReel._id}/submit`);
            toast.success('Reel submitted for admin review!');
            navigate('/vendor/reels');
        } catch { } finally { setSubmitting(false); }
    };

    const handleSaveDraft = () => {
        toast.success('Reel saved as draft.');
        navigate('/vendor/reels');
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100/80 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/vendor/reels')} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
                        <FiArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FiFilm className="text-blue-600" /> Upload Product Reel
                        </h1>
                        <p className="text-xs text-gray-500">Create a high-converting shoppable reel for your products</p>
                    </div>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100/80 shadow-sm flex items-center justify-between gap-2">
                {STEPS.map((label, i) => (
                    <React.Fragment key={label}>
                        <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-100' : 'bg-gray-100 text-gray-400'
                            }`}>
                                {i < step ? <FiCheck size={14} /> : i + 1}
                            </div>
                            <span className={`text-xs font-bold hidden sm:block ${i <= step ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-emerald-500' : 'bg-gray-100'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Main Form Container */}
            <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-6">
                {/* Step 0: Upload Video */}
                {step === 0 && (
                    <div>
                        <h2 className="text-base font-bold text-gray-900 mb-4">Select Video File</h2>
                        {!videoFile ? (
                            <button
                                onClick={() => videoInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-12 flex flex-col items-center gap-3 transition-all group bg-gray-50/50 hover:bg-blue-50/30"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-all">
                                    <FiUpload size={24} className="text-blue-600" />
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-900 font-bold text-sm">Click to select video</p>
                                    <p className="text-gray-400 text-xs mt-1">MP4, MOV, AVI, WebM — up to 200MB</p>
                                </div>
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative rounded-2xl overflow-hidden bg-slate-950 max-h-72 flex items-center justify-center">
                                    <video src={videoPreview} controls className="max-h-72 w-auto mx-auto rounded-xl" />
                                    <button
                                        onClick={() => { setVideoFile(null); setVideoPreview(''); }}
                                        className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full transition-all shadow-md"
                                    ><FiX size={14} /></button>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-3">
                                    <FiFilm className="text-blue-600 flex-shrink-0" size={16} />
                                    <div>
                                        <p className="text-gray-900 font-semibold">{videoFile.name}</p>
                                        <p>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/webm" className="hidden" onChange={handleVideoSelect} />
                        <div className="flex justify-end mt-6">
                            <button onClick={() => videoFile && setStep(1)} disabled={!videoFile}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm">
                                Next <FiArrowRight size={15} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 1: Details */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-base font-bold text-gray-900 mb-4">Reel Details</h2>
                        <div>
                            <label className="text-xs font-bold text-gray-700 mb-1 block">Title *</label>
                            <input
                                value={details.title} maxLength={120}
                                onChange={(e) => setDetails((d) => ({ ...d, title: e.target.value }))}
                                placeholder="e.g. Summer collection – must-have dress!"
                                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 mb-1 block">Caption</label>
                            <textarea
                                value={details.caption} maxLength={300} rows={2}
                                onChange={(e) => setDetails((d) => ({ ...d, caption: e.target.value }))}
                                placeholder="Short caption shown on the reel..."
                                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 mb-1 block">Description</label>
                            <textarea
                                value={details.description} maxLength={500} rows={3}
                                onChange={(e) => setDetails((d) => ({ ...d, description: e.target.value }))}
                                placeholder="Describe what's featured in this reel..."
                                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 mb-1 block">Category</label>
                                <select
                                    value={details.category}
                                    onChange={(e) => setDetails((d) => ({ ...d, category: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all"
                                >
                                    <option value="">Select category</option>
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 mb-1 block">Visibility</label>
                                <select
                                    value={details.visibility}
                                    onChange={(e) => setDetails((d) => ({ ...d, visibility: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all"
                                >
                                    <option value="public">Public</option>
                                    <option value="unlisted">Unlisted</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 mb-1 block">Tags (comma-separated)</label>
                            <input
                                value={details.tags}
                                onChange={(e) => setDetails((d) => ({ ...d, tags: e.target.value }))}
                                placeholder="fashion, summer, trendy"
                                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                            />
                        </div>
                        <div className="flex justify-between mt-6">
                            <button onClick={() => setStep(0)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 px-4 py-2 text-xs font-bold transition-all">
                                <FiArrowLeft size={15} /> Back
                            </button>
                            <button onClick={() => details.title.trim() && setStep(2)} disabled={!details.title.trim()}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm">
                                Next <FiArrowRight size={15} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Tag Products */}
                {step === 2 && (
                    <div>
                        <h2 className="text-base font-bold text-gray-900 mb-1">Tag Products</h2>
                        <p className="text-gray-500 text-xs mb-4">Tag up to 5 products from your store</p>
                        <div className="relative mb-4">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                            <input
                                value={productSearch}
                                onChange={(e) => { setProductSearch(e.target.value); searchProducts(e.target.value); }}
                                placeholder="Search your products by name..."
                                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                            />
                        </div>

                        {/* Search Results */}
                        {productResults.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 mb-4 max-h-48 overflow-y-auto divide-y divide-gray-100 shadow-sm">
                                {productResults.map((p) => {
                                    const tagged = taggedProducts.some((t) => t.productId === p._id);
                                    return (
                                        <button key={p._id} onClick={() => toggleProduct(p)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-all text-left ${tagged ? 'opacity-50' : ''}`}
                                        >
                                            {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-gray-900 text-xs font-bold truncate">{p.name}</p>
                                                <p className="text-blue-600 text-xs font-semibold">₹{p.price}</p>
                                            </div>
                                            {tagged && <FiCheck className="text-emerald-600 flex-shrink-0" size={16} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Tagged Products */}
                        {taggedProducts.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">Tagged Products ({taggedProducts.length}/5)</p>
                                {taggedProducts.map((tp, i) => (
                                    <div key={tp.productId} className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2">
                                        <FiTag className="text-blue-600 flex-shrink-0" size={14} />
                                        <span className="text-gray-900 text-xs font-medium flex-1">{tp.label}</span>
                                        <button onClick={() => setTaggedProducts((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 p-1 transition-all"><FiX size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between mt-6">
                            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 px-4 py-2 text-xs font-bold transition-all">
                                <FiArrowLeft size={15} /> Back
                            </button>
                            <button onClick={() => setStep(3)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm">
                                Preview <FiArrowRight size={15} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Preview & Upload */}
                {step === 3 && !uploadedReel && (
                    <div>
                        <h2 className="text-base font-bold text-gray-900 mb-4">Preview &amp; Upload</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="rounded-2xl overflow-hidden bg-slate-950 aspect-[9/16] max-h-72 flex items-center justify-center">
                                <video src={videoPreview} controls className="max-h-72 w-auto mx-auto" />
                            </div>
                            <div className="space-y-3">
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                                    <InfoRow label="Title" value={details.title} />
                                    <InfoRow label="Caption" value={details.caption || '—'} />
                                    <InfoRow label="Category" value={details.category || '—'} />
                                    <InfoRow label="Visibility" value={details.visibility} />
                                    <InfoRow label="Tagged Products" value={taggedProducts.length > 0 ? `${taggedProducts.length} product(s)` : '—'} />
                                </div>
                            </div>
                        </div>

                        {uploading && (
                            <div className="mt-5">
                                <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                                    <span>Uploading to Cloudinary…</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between mt-6">
                            <button onClick={() => setStep(2)} disabled={uploading} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 px-4 py-2 text-xs font-bold transition-all disabled:opacity-40">
                                <FiArrowLeft size={15} /> Back
                            </button>
                            <button onClick={uploadVideo} disabled={uploading}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-8 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm">
                                <FiUpload size={15} /> {uploading ? `Uploading ${progress}%...` : 'Upload to Cloudinary'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Success */}
                {step === 3 && uploadedReel && (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiCheck size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Reel Uploaded Successfully! 🎉</h2>
                        <p className="text-gray-500 text-xs mb-6">Submit it for admin review to make it live across the platform.</p>
                        {uploadedReel.thumbnailUrl && (
                            <img src={uploadedReel.thumbnailUrl} alt="Thumbnail" className="w-32 h-48 object-cover rounded-xl mx-auto mb-6 shadow-md border border-gray-200" />
                        )}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button onClick={handleSaveDraft}
                                className="px-6 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-xs transition-all">
                                Save as Draft
                            </button>
                            <button onClick={handleSubmitForReview} disabled={submitting}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-all disabled:opacity-60 shadow-sm">
                                {submitting ? 'Submitting…' : 'Submit for Admin Review'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between text-xs">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className="text-gray-900 font-bold text-right max-w-[60%] line-clamp-1">{value}</span>
    </div>
);

export default VendorReelUpload;
