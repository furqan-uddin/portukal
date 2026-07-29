import Joi from 'joi';

const mobileRegex = /^[6-9]\d{9}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const upiRegex = /^[\w.-]+@[\w.-]+$/;

export const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
        'any.required': 'Full name is required.',
        'string.empty': 'Full name cannot be empty.',
    }),
    email: Joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please enter a valid email address.',
        'any.required': 'Email address is required.',
    }),
    mobile: Joi.string().trim().pattern(mobileRegex).required().messages({
        'string.pattern.base': 'Please enter a valid 10-digit mobile number.',
        'any.required': 'Mobile number is required.',
    }),
    password: Joi.string().min(8).allow('').optional().messages({
        'string.min': 'Password must be at least 8 characters long.',
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).allow('').optional().messages({
        'any.only': 'Confirm password must match password.',
    }),
    profileImage: Joi.string().allow('').optional(),
    bio: Joi.string().max(500).allow('').optional(),
    followers: Joi.number().min(0).allow('', null).default(0).optional(),
    socialLinks: Joi.object({
        instagram: Joi.string().uri({ allowRelative: false }).allow('').optional(),
        youtube: Joi.string().uri({ allowRelative: false }).allow('').optional(),
        facebook: Joi.string().uri({ allowRelative: false }).allow('').optional(),
        linkedin: Joi.string().uri({ allowRelative: false }).allow('').optional(),
        website: Joi.string().uri({ allowRelative: false }).allow('').optional(),
    }).optional(),
    bankDetails: Joi.object({
        accountHolderName: Joi.string().trim().allow('').optional(),
        bankName: Joi.string().trim().allow('').optional(),
        accountNumber: Joi.string().trim().allow('').optional(),
        ifscCode: Joi.string().trim().uppercase().pattern(ifscRegex).allow('').optional().messages({
            'string.pattern.base': 'Invalid IFSC Code format (e.g. SBIN0001234).',
        }),
        upiId: Joi.string().trim().pattern(upiRegex).allow('').optional().messages({
            'string.pattern.base': 'Invalid UPI ID format (e.g. user@upi).',
        }),
    }).optional(),
    panNumber: Joi.string().trim().uppercase().pattern(panRegex).allow('').optional().messages({
        'string.pattern.base': 'Invalid PAN Number format (e.g. ABCDE1234F).',
    }),
    aadhaarNumber: Joi.string().trim().pattern(/^\d{12}$/).allow('').optional().messages({
        'string.pattern.base': 'Aadhaar number must be exactly 12 digits.',
    }),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please enter a valid email address.',
        'any.required': 'Email is required.',
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required.',
    }),
    rememberMe: Joi.boolean().optional(),
});

export const verifyEmailOtpSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    otp: Joi.string().pattern(/^\d{6}$/).required().messages({
        'string.pattern.base': 'OTP must be a 6-digit number.',
        'any.required': 'OTP is required.',
    }),
});

export const resendEmailOtpSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
});

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please enter a valid email address.',
        'any.required': 'Email address is required.',
    }),
});

export const verifyOtpSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    otp: Joi.string().pattern(/^\d{6}$/).required().messages({
        'string.pattern.base': 'OTP must be a 6-digit number.',
        'any.required': 'OTP is required.',
    }),
});

export const resetPasswordSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    otp: Joi.string().pattern(/^\d{6}$/).required().messages({
        'string.pattern.base': 'OTP must be a 6-digit number.',
        'any.required': 'OTP is required.',
    }),
    password: Joi.string().min(8).required().messages({
        'string.min': 'Password must be at least 8 characters long.',
        'any.required': 'New password is required.',
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Confirm password must match new password.',
    }),
});

export const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    bio: Joi.string().max(500).allow('').optional(),
    followers: Joi.number().min(0).allow('', null).optional(),
    profileImage: Joi.string().allow('').optional(),
    socialLinks: Joi.object({
        instagram: Joi.string().uri({ allowRelative: false }).allow('').optional(),
        youtube: Joi.string().uri({ allowRelative: false }).allow('').optional(),
        facebook: Joi.string().uri({ allowRelative: false }).allow('').optional(),
        linkedin: Joi.string().uri({ allowRelative: false }).allow('').optional(),
        website: Joi.string().uri({ allowRelative: false }).allow('').optional(),
    }).optional(),
    bankDetails: Joi.object({
        accountHolderName: Joi.string().trim().allow('').optional(),
        bankName: Joi.string().trim().allow('').optional(),
        accountNumber: Joi.string().trim().allow('').optional(),
        ifscCode: Joi.string().trim().uppercase().pattern(ifscRegex).allow('').optional(),
        upiId: Joi.string().trim().pattern(upiRegex).allow('').optional(),
    }).optional(),
});
