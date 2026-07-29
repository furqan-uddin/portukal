import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Route imports
import publicRoutes from './routes/public.routes.js';
import userRoutes from './modules/user/routes/user.routes.js';
import adminRoutes from './modules/admin/routes/admin.routes.js';
import vendorRoutes from './modules/vendor/routes/vendor.routes.js';
import deliveryRoutes from './modules/delivery/routes/delivery.routes.js';
import influencerRoutes from './modules/influencer/routes/influencer.routes.js';
import influencerMarketplaceRoutes from './modules/influencer/routes/influencerMarketplace.routes.js';
import affiliateLinkRoutes from './modules/influencer/routes/affiliateLink.routes.js';
import referralRoutes from './modules/influencer/routes/referral.routes.js';
import commissionConfigRoutes from './modules/influencer/routes/commissionConfig.routes.js';
import influencerWalletRoutes from './modules/influencer/routes/influencerWallet.routes.js';
import vendorWalletRoutes from './modules/vendor/routes/vendorWallet.routes.js';
import adminWithdrawalRoutes from './modules/admin/routes/adminWithdrawal.routes.js';
import analyticsRoutes from './modules/influencer/routes/analytics.routes.js';
import notificationsRoutes from './modules/influencer/routes/notifications.routes.js';
import reportsRoutes from './modules/influencer/routes/reports.routes.js';
import fraudRoutes from './modules/influencer/routes/fraud.routes.js';
import auditRoutes from './modules/influencer/routes/audit.routes.js';
import systemHealthRoutes from './modules/influencer/routes/systemHealth.routes.js';
import { startSettlementWorker } from './modules/influencer/services/SettlementWorker.js';
import { ReportService } from './modules/influencer/services/ReportService.js';
import webhookRouter from './modules/user/routes/webhook.routes.js';
import paymentRouter from './modules/user/routes/payment.routes.js';
import vendorReelRoutes from './modules/reels/routes/vendor.reel.routes.js';
import adminReelRoutes from './modules/reels/routes/admin.reel.routes.js';
import influencerReelRoutes from './modules/reels/routes/influencer.reel.routes.js';
import userReelRoutes from './modules/reels/routes/user.reel.routes.js';
import influencerSupportRoutes from './modules/influencer/routes/influencerSupport.routes.js';
import adminInfluencerSupportRoutes from './modules/Admin/routes/adminInfluencerSupport.routes.js';

// Middleware imports
import { apiLimiter } from './middlewares/rateLimiter.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '../uploads');
const deliveryDocsRoot = path.resolve(uploadsRoot, 'delivery-docs');

const isValidDeliveryDocToken = (relativePath, rawToken) => {
    if (!rawToken) return false;
    const [expRaw, providedSignature] = String(rawToken).split('.');
    const exp = Number(expRaw);
    if (!Number.isFinite(exp) || exp <= Date.now() || !providedSignature) return false;

    const payload = `${relativePath}|${exp}`;
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured.');
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    if (providedSignature.length !== expectedSignature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature));
};

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
    : ['http://localhost:5173'];

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());
app.use(cors({
    origin: IS_PRODUCTION
        ? (origin, callback) => {
            if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
            callback(new Error(`CORS policy: Origin ${origin} not allowed.`));
        }
        : true, // Allow all origins in development
    credentials: true,
}));

// Compress JSON responses to reduce payload transfer time.
app.use(compression());

// ─── Webhook Route (MUST be before express.json to preserve raw body for HMAC) ─
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRouter);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use(
    '/uploads/delivery-docs',
    (req, res, next) => {
        const relativePath = `/uploads/delivery-docs${req.path}`;
        const token = req.query.docToken;
        if (!isValidDeliveryDocToken(relativePath, token)) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        next();
    },
    express.static(deliveryDocsRoot, { fallthrough: false })
);

app.use(
    '/uploads',
    (req, res, next) => {
        if (req.path.startsWith('/delivery-docs/')) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        next();
    },
    express.static(uploadsRoot)
);
app.use('/api', publicRoutes);                       // Public: products, categories, brands, coupons, banners
app.use('/api/user', userRoutes);                    // Customer: auth, addresses, wishlist, reviews, orders
app.use('/api/user/payment', paymentRouter);         // Payment: initialize, retry, exchange-upgrade
app.use('/api/admin', adminRoutes);                  // Admin: auth, vendors, orders, catalog, analytics
app.use('/api/vendor', vendorRoutes);                // Vendor: auth, products, orders, earnings
app.use('/api/delivery', deliveryRoutes);            // Delivery: auth, orders
app.use('/api/influencer', influencerRoutes);          // Influencer: auth, profile, dashboard
app.use('/api/influencer', influencerMarketplaceRoutes);
app.use('/api/influencer/affiliate-links', affiliateLinkRoutes);
app.use('/api/influencer/commission-settings', commissionConfigRoutes);
app.use('/api/admin/influencer-commission-settings', commissionConfigRoutes);
app.use('/api/vendor/influencer-commission-settings', commissionConfigRoutes);
app.use('/api/influencer/wallet', influencerWalletRoutes);
app.use('/api/vendor/influencer-wallet', vendorWalletRoutes);
app.use('/api/admin/withdrawals', adminWithdrawalRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin/influencer/fraud', fraudRoutes);
app.use('/api/admin/audit', auditRoutes);
app.use('/api/admin/system', systemHealthRoutes);

// ─── Shoppable Reels ─────────────────────────────────────────────────────────
app.use('/api/vendor/reels', vendorReelRoutes);        // Vendor: upload, manage, schedule, version
app.use('/api/admin/reels', adminReelRoutes);           // Admin: moderate, feature, analytics
app.use('/api/influencer/reels', influencerReelRoutes); // Influencer: browse, affiliate link
app.use('/api/reels', userReelRoutes);                  // User: feed, interactions, comments
app.use('/api/influencer', influencerSupportRoutes);        // Influencer: admin support tickets & vendor collaborations
app.use('/api/admin/influencer-support', adminInfluencerSupportRoutes); // Admin: influencer support live chat

// Start Background Settlement Worker (Runs every 1 hour)
startSettlementWorker(60 * 60 * 1000);

// Daily Report Expiry Cleanup Worker (Runs every 24 hours)
setInterval(() => {
    ReportService.cleanExpiredReportsWorker().catch((err) => console.error('[ReportCleanup] Error:', err));
}, 24 * 60 * 60 * 1000);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
