# Porutkal Influencer Module – Enterprise Master Roadmap

This document outlines the complete structural roadmap for the **Porutkal Influencer & Affiliate Marketing Module**. It organizes all capabilities across 4 clean phases to guide development from initial authentication through business execution, enterprise operations, and future growth features.

---

## Phase 1 – Influencer Foundation ✅ (Completed)

### Authentication
- Registration Flow
- Login & JWT Token Management
- Email Verification (OTP)
- Forgot Password & OTP Verification
- Reset Password

### Profile Management
- Creator Personal Details
- Social Media Handle Links
- PAN Details
- Aadhaar Details
- Bank Account Details
- UPI ID Integration

### Admin Portal Management
- Application Review & Approval
- Rejection with Reason
- Account Suspension
- Account Activation

### Creator Dashboards
- Pending Application Status Dashboard
- Approved Creator Overview Dashboard

---

## Phase 2 – Core Business Engine

### ✅ Part 1 (Completed)

#### Marketplace
- Browse Promotional Products (`/influence/marketplace`)
- Product Details (`/influence/product/:slug`)
- Search by Product Name, Brand, Vendor, or SKU
- Multi-filters (Category, Brand, Price Range, Min Commission %, Rating, Discount)
- Sorting (Newest, Price Low → High, Price High → Low, Highest Commission, Highest Rated, Best Selling)

#### Affiliate Links
- Generate Unique Affiliate Link (`porutkal.com/product/slug?ref=CODE`)
- One Creator + One Product Deduplication Check
- Copy to Clipboard with Toast Notification
- Soft Delete (`status = 'deleted'`)
- Live Status Management (`Active`, `Inactive`, `Deleted`, `Expired`)

#### Referral Tracking
- Last Click Wins Attribution Policy
- 30-Day Attribution Window
- Dual-Storage Session Persistence (30-day HTTP Cookie + LocalStorage)
- 1-Hour Duplicate Click Suppression
- Self-Referral Fraud Prevention (Blocks creator from earning on own orders)

#### Commission Configuration
- Admin Commission Bounds (Min %, Max %, Default %, Program Enable/Disable)
- Vendor Influencer Program Settings & Default Commission Rate
- Product-Level Commission Overrides
- Dynamic Order-Time Commission Calculation & Admin Max Limit Clamping

---

### Part 2 (Next Execution Target)

#### Vendor Wallet
- Balance Overview
- Reserved Escrow Balance
- Withdrawable Balance
- Financial Ledger

#### Influencer Wallet
- Pending Balance
- Reserved Escrow Balance
- Available / Withdrawable Balance
- Total Withdrawn
- Total Lifetime Earnings

#### Commission Engine
- Reserve Commission (On Order Placement)
- Release Commission (Post Return Window Expiry)
- Reverse Commission (On Order Cancellation / Refund)
- Multi-Vendor Commission Breakdown Calculation

#### Settlement Engine
- Return Window Tracking (e.g. 7-14 Days)
- Automated Escrow Settlement Cron / Background Job
- Automated Commission Reversal Handling

#### Withdrawals
- Influencer Withdrawal Request Submission
- Admin Withdrawal Approval & Rejection Workflow
- Automated / Manual Payment Processing
- Real-Time Wallet Balance Updates

#### Wallet Transactions Log
- Reserve Transaction Records
- Release Transaction Records
- Withdrawal Transaction Records
- Refund Reversal Records
- Manual Adjustment Logs

---

## Phase 3 – Enterprise Features

### Part 1 – Analytics & Dashboards

#### Influencer Dashboard
- Total Clicks Count
- Total Converted Orders Count
- Generated Gross Sales Revenue
- Total Earnings & Pending Escrow
- Conversion Rate % Calculation
- Top Performing Products & Links
- Monthly Performance Breakdown

#### Vendor Dashboard
- Influencer-Driven Sales & Revenue
- Return on Investment (ROI) Metrics
- Total Commission Paid
- Top Performing Affiliate Creators
- Reserved vs. Released Commission Balances

#### Admin Dashboard
- Total Influencers Count (Active, Pending, Suspended)
- Total Affiliate Orders & Sales Volume
- Total Platform & Creator Commissions
- Pending Withdrawal Requests & Escrow Balances
- Released Commissions Summary
- Top Performing Vendors & Products
- Platform Revenue Share Breakdown

---

### Part 2 – Reports & Notifications

#### Reporting Engine
- Daily, Weekly, Monthly, and Yearly Performance Reports
- Export Capabilities:
  - CSV Format
  - Excel Format
  - PDF Summaries

#### Automated Notifications

##### Influencer Notifications
- New Sale Converted Event
- Commission Reserved Event
- Commission Released Event
- Withdrawal Approved Event
- Withdrawal Rejected Event

##### Vendor Notifications
- New Affiliate Order Received Event
- Commission Reserved Notification
- Commission Released Notification

##### Admin Notifications
- New Withdrawal Request Submitted
- Fraud / Suspicious Activity Alerts
- System Program Notifications

---

### Part 3 – Fraud Detection & Optimization

#### Advanced Fraud Detection
- Self-Referral Detection & Auto-Blocking
- Duplicate Account Detection
- Fake Click & Bot Traffic Detection
- Suspicious Conversion Rate Anomalies
- IP Subnet & Geolocation Tracking
- Device Fingerprinting
- Rapid Click & Velocity Pattern Detection
- Click Spamming & Click Flooding Prevention

#### Comprehensive Audit Logs
- Link Generation Logs
- Referral Click Logs
- Commission Policy Change Logs
- Wallet Balance Adjustment Logs
- Withdrawal Request & Payment Logs
- Admin Action Audit Trail

#### Leaderboards
- Top Influencers Leaderboard
- Top Promotional Vendors Leaderboard
- Top Grossing Products Leaderboard
- Top Categories Leaderboard

#### Conversion Funnel Analytics
```text
Clicks
  │
  ▼
Product Views
  │
  ▼
Add To Cart
  │
  ▼
Orders Placed
  │
  ▼
Order Delivered
  │
  ▼
Commission Released (Post-Return Window)
```

#### Performance & Scalability Optimizations
- MongoDB Aggregation Pipelines
- Asynchronous Background Worker Queues
- Redis Caching Layer
- Optimized Database Indexing Strategy
- Fast Cursor-Based Pagination

---

## Phase 4 – Future Enhancements (Optional / Post-Launch Growth)

### Campaign Management
- Influencer Promotional Campaigns
- Vendor-Sponsored Product Campaigns
- Limited-Time Flash Commission Boosts
- Campaign Analytics & ROI Tracking

### Influencer Promo Codes
- Creator-Specific Discount Coupons
- Dedicated Coupon Code Tracking
- Combined Coupon + Referral Attribution Engine

### Social Media Platform Integration
- Instagram Profile & Post Verification
- YouTube Creator API Integration
- Facebook & X (Twitter) Creator Integrations

### Short Links & UTM Builder
- Custom Branded Short Links
- Dynamic Deep Linking
- Custom UTM Parameter Auto-Injection

### Mobile Application Features
- Push Notifications for Conversion Events
- Mobile Deep Linking SDK
- One-Click Social Share SDK

### AI-Driven Analytics & Automation
- Smart Product Recommendation Engine for Creators
- Optimal Time-to-Share Predictive Insights
- Sales & Conversion Forecasting
- AI-Powered Anomaly & Fraud Detection

### Gamification & Creator Rewards
- Creator Achievement Badges
- Creator Tier Levels (Silver, Gold, Platinum)
- Tiered Commission Bonuses & Rewards
- Seasonal Creator Challenges & Competitions

---

## Recommended Project Lifecycle & Phase Structure

| Phase | Description | Focus Area | Status |
|---|---|---|---|
| **Phase 1** | Foundation & Authentication | Creator Auth, Profile Setup & Admin Approval | ✅ **Completed** |
| **Phase 2 (Part 1)** | Core Business Engine | Marketplace, Links, Tracking & Commission Setup | ✅ **Completed** |
| **Phase 2 (Part 2)** | Financial Engine | Wallets, Commission Escrow, Settlements & Withdrawals | ⏳ **Next Target** |
| **Phase 3** | Enterprise Operations | Dashboards, Reports, Fraud Prevention & Audit Logs | 🔜 Planned |
| **Phase 4** | Future Enhancements | Campaigns, AI Insights, Gamification & Social APIs | 💡 Optional |

---

*Document finalized for Porutkal Multi-Vendor Marketplace.*
