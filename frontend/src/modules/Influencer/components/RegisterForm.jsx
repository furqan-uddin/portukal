import { useState } from 'react';
import {
    User,
    Mail,
    Phone,
    Lock,
    Eye,
    EyeOff,
    Instagram,
    Youtube,
    Facebook,
    Linkedin,
    Globe,
    CreditCard,
    Building2,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Loader2,
    ShieldCheck,
    Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useInfluencerAuth } from '../hooks/useInfluencerAuth';

const RegisterForm = ({ onSwitchToLogin, onRequireEmailVerification }) => {
    const { register, isLoading } = useInfluencerAuth();

    const [currentStep, setCurrentStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    // Form fields state
    const [formData, setFormData] = useState({
        // Step 1
        name: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
        profileImage: '',
        bio: '',
        followers: '',
        // Step 2
        instagram: '',
        youtube: '',
        facebook: '',
        linkedin: '',
        website: '',
        // Step 3
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: '',
        panNumber: '',
        aadhaarNumber: '',
        agreeTerms: false,
    });

    const validateSingleField = (name, val, updatedFormData = formData) => {
        let error = '';

        if (name === 'name') {
            if (!val.trim()) {
                error = 'Full Name is required.';
            } else if (/\d/.test(val)) {
                error = 'Numbers are not allowed in Full Name.';
            } else if (!/^[a-zA-Z\s.'-]+$/.test(val)) {
                error = 'Only letters, spaces, dots, and hyphens are allowed.';
            }
        } else if (name === 'email') {
            if (!val.trim()) {
                error = 'Email address is required.';
            } else if (!/\S+@\S+\.\S+/.test(val.trim())) {
                error = 'Please enter a valid email address.';
            }
        } else if (name === 'mobile') {
            if (!val.trim()) {
                error = 'Mobile number is required.';
            } else if (!/^[6-9]\d{9}$/.test(val.trim())) {
                error = 'Mobile number must be 10 digits starting with 6-9.';
            }
        } else if (name === 'password') {
            if (!val) {
                error = 'Password is required.';
            } else if (val.length < 8) {
                error = 'Password must be at least 8 characters long.';
            }
        } else if (name === 'confirmPassword') {
            if (!val) {
                error = 'Confirm password is required.';
            } else if (val !== updatedFormData.password) {
                error = 'Passwords do not match.';
            }
        } else if (name === 'ifscCode') {
            if (val.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(val.trim().toUpperCase())) {
                error = 'Invalid IFSC Code format (e.g. SBIN0001234).';
            }
        } else if (name === 'panNumber') {
            if (val.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val.trim().toUpperCase())) {
                error = 'Invalid PAN Number format (e.g. ABCDE1234F).';
            }
        } else if (name === 'upiId') {
            if (val.trim() && !/^[\w.-]+@[\w.-]+$/.test(val.trim())) {
                error = 'Invalid UPI ID format (e.g. user@upi).';
            }
        } else if (name === 'aadhaarNumber') {
            if (val.trim() && !/^\d{12}$/.test(val.trim())) {
                error = 'Aadhaar number must be exactly 12 digits.';
            }
        }

        return error;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        const newFormData = {
            ...formData,
            [name]: newValue,
        };

        setFormData(newFormData);

        // Live validation for current field
        const err = validateSingleField(name, newValue, newFormData);

        // Also re-validate confirmPassword if password changes
        let confirmErr = fieldErrors.confirmPassword;
        if (name === 'password' && newFormData.confirmPassword) {
            confirmErr = validateSingleField('confirmPassword', newFormData.confirmPassword, newFormData);
        }

        setFieldErrors((prev) => ({
            ...prev,
            [name]: err,
            ...(name === 'password' ? { confirmPassword: confirmErr } : {}),
        }));
    };

    // Full Validation for Step 1
    const validateStep1 = () => {
        const errs = {};
        errs.name = validateSingleField('name', formData.name);
        errs.email = validateSingleField('email', formData.email);
        errs.mobile = validateSingleField('mobile', formData.mobile);
        errs.password = validateSingleField('password', formData.password);
        errs.confirmPassword = validateSingleField('confirmPassword', formData.confirmPassword);

        setFieldErrors((prev) => ({ ...prev, ...errs }));

        const firstError = Object.values(errs).find((e) => Boolean(e));
        return firstError || null;
    };

    // Validation for Step 2
    const validateStep2 = () => {
        return null;
    };

    // Full Validation for Step 3
    const validateStep3 = () => {
        const errs = {};
        if (formData.ifscCode) errs.ifscCode = validateSingleField('ifscCode', formData.ifscCode);
        if (formData.panNumber) errs.panNumber = validateSingleField('panNumber', formData.panNumber);
        if (formData.upiId) errs.upiId = validateSingleField('upiId', formData.upiId);
        if (formData.aadhaarNumber) errs.aadhaarNumber = validateSingleField('aadhaarNumber', formData.aadhaarNumber);

        setFieldErrors((prev) => ({ ...prev, ...errs }));

        const firstError = Object.values(errs).find((e) => Boolean(e));
        if (firstError) return firstError;

        if (!formData.agreeTerms) {
            return 'You must agree to the Terms & Conditions to submit your application.';
        }
        return null;
    };

    const handleNext = () => {
        setErrorMsg('');
        if (currentStep === 1) {
            const err = validateStep1();
            if (err) {
                setErrorMsg(err);
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            const err = validateStep2();
            if (err) {
                setErrorMsg(err);
                return;
            }
            setCurrentStep(3);
        }
    };

    const handlePrev = () => {
        setErrorMsg('');
        setCurrentStep((prev) => Math.max(1, prev - 1));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        const err = validateStep3();
        if (err) {
            setErrorMsg(err);
            return;
        }

        const payload = {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            mobile: formData.mobile.trim(),
            password: formData.password,
            profileImage: formData.profileImage.trim(),
            bio: formData.bio.trim(),
            followers: Number(formData.followers) || 0,
            socialLinks: {
                instagram: formData.instagram.trim(),
                youtube: formData.youtube.trim(),
                facebook: formData.facebook.trim(),
                linkedin: formData.linkedin.trim(),
                website: formData.website.trim(),
            },
            bankDetails: {
                accountHolderName: formData.accountHolderName.trim(),
                bankName: formData.bankName.trim(),
                accountNumber: formData.accountNumber.trim(),
                ifscCode: formData.ifscCode.trim().toUpperCase(),
                upiId: formData.upiId.trim(),
            },
            panNumber: formData.panNumber.trim().toUpperCase(),
            aadhaarNumber: formData.aadhaarNumber.trim(),
        };

        try {
            await register(payload);
            toast.success('Registration submitted! Please verify your 6-digit email OTP code.');
            onRequireEmailVerification(formData.email.trim().toLowerCase());
        } catch (error) {
            const msg = error?.response?.data?.message || error?.message || 'Registration failed. Please check details.';
            setErrorMsg(msg);
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Header & Step Wizard Bar */}
            <div className="influencer-wizard-header">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Apply for Influencer Portal</h2>
                <p className="text-slate-500 text-sm mb-6">
                    Step {currentStep} of 3 —{' '}
                    {currentStep === 1 && 'Personal Information'}
                    {currentStep === 2 && 'Social Accounts'}
                    {currentStep === 3 && 'Verification & Payout Details'}
                </p>

                <div className="influencer-wizard-steps">
                    <div className={`influencer-wizard-step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
                        <div className="influencer-step-circle">
                            {currentStep > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
                        </div>
                        <span className="influencer-step-label">Personal</span>
                    </div>

                    <div className={`influencer-wizard-step ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
                        <div className="influencer-step-circle">
                            {currentStep > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
                        </div>
                        <span className="influencer-step-label">Socials</span>
                    </div>

                    <div className={`influencer-wizard-step ${currentStep === 3 ? 'active' : ''}`}>
                        <div className="influencer-step-circle">3</div>
                        <span className="influencer-step-label">Payout</span>
                    </div>
                </div>
            </div>

            {errorMsg && (
                <div className="influencer-error-alert mb-5">
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* STEP 1: Personal Information */}
            {currentStep === 1 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="influencer-form-group">
                            <label className="influencer-form-label">Full Name *</label>
                            <div className="influencer-input-wrapper">
                                <input
                                    type="text"
                                    name="name"
                                    className={`influencer-form-input ${fieldErrors.name ? 'error' : ''}`}
                                    placeholder="Rahul Sharma"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            </div>
                            {fieldErrors.name && (
                                <span className="text-xs text-red-500 font-medium mt-1 block">
                                    {fieldErrors.name}
                                </span>
                            )}
                        </div>

                        <div className="influencer-form-group">
                            <label className="influencer-form-label">Mobile Number *</label>
                            <div className="influencer-input-wrapper">
                                <input
                                    type="tel"
                                    name="mobile"
                                    maxLength={10}
                                    className={`influencer-form-input ${fieldErrors.mobile ? 'error' : ''}`}
                                    placeholder="9876543210"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    required
                                />
                                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            </div>
                            {fieldErrors.mobile && (
                                <span className="text-xs text-red-500 font-medium mt-1 block">
                                    {fieldErrors.mobile}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="influencer-form-group">
                            <label className="influencer-form-label">Email Address *</label>
                            <div className="influencer-input-wrapper">
                                <input
                                    type="email"
                                    name="email"
                                    className={`influencer-form-input ${fieldErrors.email ? 'error' : ''}`}
                                    placeholder="rahul@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            </div>
                            {fieldErrors.email && (
                                <span className="text-xs text-red-500 font-medium mt-1 block">
                                    {fieldErrors.email}
                                </span>
                            )}
                        </div>

                        <div className="influencer-form-group">
                            <label className="influencer-form-label">Total Followers Count (Optional)</label>
                            <div className="influencer-input-wrapper">
                                <input
                                    type="number"
                                    name="followers"
                                    className="influencer-form-input"
                                    placeholder="e.g. 5000"
                                    value={formData.followers}
                                    onChange={handleChange}
                                />
                                <Users className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="influencer-form-group">
                            <label className="influencer-form-label">Password *</label>
                            <div className="influencer-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className={`influencer-form-input ${fieldErrors.password ? 'error' : ''}`}
                                    placeholder="Min 8 chars"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="influencer-toggle-pwd"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <span className="text-xs text-red-500 font-medium mt-1 block">
                                    {fieldErrors.password}
                                </span>
                            )}
                        </div>

                        <div className="influencer-form-group">
                            <label className="influencer-form-label">Confirm Password *</label>
                            <div className="influencer-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    className={`influencer-form-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
                                    placeholder="Re-enter password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            {fieldErrors.confirmPassword && (
                                <span className="text-xs text-red-500 font-medium mt-1 block">
                                    {fieldErrors.confirmPassword}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="influencer-form-group">
                        <label className="influencer-form-label">Profile Photo URL (Optional)</label>
                        <input
                            type="url"
                            name="profileImage"
                            className="influencer-form-input"
                            placeholder="https://example.com/avatar.jpg"
                            value={formData.profileImage}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="influencer-form-group">
                        <label className="influencer-form-label">Creator Bio (Optional)</label>
                        <textarea
                            name="bio"
                            rows={2}
                            className="influencer-form-input"
                            placeholder="Tell vendors about your audience, style, and niche..."
                            value={formData.bio}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="button" onClick={handleNext} className="influencer-btn-primary mt-6">
                        <span>Continue to Social Accounts</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* STEP 2: Social Accounts */}
            {currentStep === 2 && (
                <div className="space-y-4">
                    <div className="influencer-form-group">
                        <label className="influencer-form-label">Instagram Handle / URL</label>
                        <div className="influencer-input-wrapper">
                            <input
                                type="text"
                                name="instagram"
                                className="influencer-form-input"
                                placeholder="https://instagram.com/yourhandle"
                                value={formData.instagram}
                                onChange={handleChange}
                            />
                            <Instagram className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-500 w-4 h-4" />
                        </div>
                    </div>

                    <div className="influencer-form-group">
                        <label className="influencer-form-label">YouTube Channel URL</label>
                        <div className="influencer-input-wrapper">
                            <input
                                type="text"
                                name="youtube"
                                className="influencer-form-input"
                                placeholder="https://youtube.com/@yourchannel"
                                value={formData.youtube}
                                onChange={handleChange}
                            />
                            <Youtube className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 w-4 h-4" />
                        </div>
                    </div>

                    <div className="influencer-form-group">
                        <label className="influencer-form-label">Facebook Profile / Page</label>
                        <div className="influencer-input-wrapper">
                            <input
                                type="text"
                                name="facebook"
                                className="influencer-form-input"
                                placeholder="https://facebook.com/yourpage"
                                value={formData.facebook}
                                onChange={handleChange}
                            />
                            <Facebook className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 w-4 h-4" />
                        </div>
                    </div>

                    <div className="influencer-form-group">
                        <label className="influencer-form-label">LinkedIn Profile</label>
                        <div className="influencer-input-wrapper">
                            <input
                                type="text"
                                name="linkedin"
                                className="influencer-form-input"
                                placeholder="https://linkedin.com/in/yourprofile"
                                value={formData.linkedin}
                                onChange={handleChange}
                            />
                            <Linkedin className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4" />
                        </div>
                    </div>

                    <div className="influencer-form-group">
                        <label className="influencer-form-label">Personal Website / Blog</label>
                        <div className="influencer-input-wrapper">
                            <input
                                type="text"
                                name="website"
                                className="influencer-form-input"
                                placeholder="https://yourblog.com"
                                value={formData.website}
                                onChange={handleChange}
                            />
                            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={handlePrev} className="influencer-btn-secondary flex-1 flex items-center justify-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back</span>
                        </button>
                        <button type="button" onClick={handleNext} className="influencer-btn-primary flex-1">
                            <span>Continue to Payout Details</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: Verification & Payout Details */}
            {currentStep === 3 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="influencer-form-group">
                            <label className="influencer-form-label">Account Holder Name</label>
                            <input
                                type="text"
                                name="accountHolderName"
                                className="influencer-form-input"
                                placeholder="Rahul Sharma"
                                value={formData.accountHolderName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="influencer-form-group">
                            <label className="influencer-form-label">Bank Name</label>
                            <input
                                type="text"
                                name="bankName"
                                className="influencer-form-input"
                                placeholder="HDFC Bank"
                                value={formData.bankName}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="influencer-form-group">
                            <label className="influencer-form-label">Account Number</label>
                            <input
                                type="text"
                                name="accountNumber"
                                className="influencer-form-input"
                                placeholder="50100012345678"
                                value={formData.accountNumber}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="influencer-form-group">
                            <label className="influencer-form-label">IFSC Code</label>
                            <input
                                type="text"
                                name="ifscCode"
                                className={`influencer-form-input uppercase ${fieldErrors.ifscCode ? 'error' : ''}`}
                                placeholder="HDFC0001234"
                                value={formData.ifscCode}
                                onChange={handleChange}
                            />
                            {fieldErrors.ifscCode && (
                                <span className="text-xs text-red-500 font-medium mt-1 block">
                                    {fieldErrors.ifscCode}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="influencer-form-group">
                            <label className="influencer-form-label">UPI ID</label>
                            <input
                                type="text"
                                name="upiId"
                                className={`influencer-form-input ${fieldErrors.upiId ? 'error' : ''}`}
                                placeholder="rahul@okhdfcbank"
                                value={formData.upiId}
                                onChange={handleChange}
                            />
                            {fieldErrors.upiId && (
                                <span className="text-xs text-red-500 font-medium mt-1 block">
                                    {fieldErrors.upiId}
                                </span>
                            )}
                        </div>

                        <div className="influencer-form-group">
                            <label className="influencer-form-label">PAN Number</label>
                            <input
                                type="text"
                                name="panNumber"
                                className={`influencer-form-input uppercase ${fieldErrors.panNumber ? 'error' : ''}`}
                                placeholder="ABCDE1234F"
                                value={formData.panNumber}
                                onChange={handleChange}
                            />
                            {fieldErrors.panNumber && (
                                <span className="text-xs text-red-500 font-medium mt-1 block">
                                    {fieldErrors.panNumber}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="influencer-form-group">
                        <label className="influencer-form-label">Aadhaar Number</label>
                        <input
                            type="text"
                            name="aadhaarNumber"
                            maxLength={12}
                            className={`influencer-form-input ${fieldErrors.aadhaarNumber ? 'error' : ''}`}
                            placeholder="12-digit Aadhaar number"
                            value={formData.aadhaarNumber}
                            onChange={handleChange}
                        />
                        {fieldErrors.aadhaarNumber && (
                            <span className="text-xs text-red-500 font-medium mt-1 block">
                                {fieldErrors.aadhaarNumber}
                            </span>
                        )}
                    </div>

                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-start gap-3 my-2">
                        <input
                            type="checkbox"
                            id="agreeTerms"
                            name="agreeTerms"
                            checked={formData.agreeTerms}
                            onChange={handleChange}
                            className="mt-1 rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="agreeTerms" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
                            I declare that all submitted personal, social, and payment information is accurate. I agree to the{' '}
                            <span className="font-semibold text-purple-700">Porutkal Influencer Program Terms & Conditions</span>.
                        </label>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={handlePrev} className="influencer-btn-secondary flex-1 flex items-center justify-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back</span>
                        </button>
                        <button type="submit" className="influencer-btn-primary flex-1" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <span>Submit Application</span>
                                    <ShieldCheck className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}

            <div className="text-center mt-6 text-xs text-slate-500">
                Already registered?{' '}
                <button
                    type="button"
                    onClick={() => onSwitchToLogin()}
                    className="font-bold text-purple-600 hover:text-purple-700 hover:underline ml-1"
                >
                    Sign in to Portal
                </button>
            </div>
        </div>
    );
};

export default RegisterForm;
