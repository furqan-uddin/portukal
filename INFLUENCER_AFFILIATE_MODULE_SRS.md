# Porutkal Multi-Vendor Marketplace
# Influencer & Affiliate Marketing Module
## Software Requirement Specification (SRS) & Technical Design Document

Version: 1.0

---

# 1. Overview

The Influencer Module enables social media creators, bloggers, YouTubers, Instagram creators, and affiliate marketers to promote products listed on the Porutkal Marketplace.

Influencers earn commission whenever customers purchase products through their referral links.

Unlike vendors, influencers do not own inventory or process orders.

Their responsibility is limited to promoting products and generating sales.

This module is tightly integrated with:

* User App
* Vendor Panel
* Admin Panel
* Wallet System
* Settlement Engine
* Order Module
* Notification System

---

# 2. Objectives

The Influencer Module aims to:

* Increase product sales through creators.
* Help vendors acquire customers.
* Provide influencers with a transparent earning system.
* Automate commission tracking.
* Integrate with existing wallet and settlement modules.
* Prevent commission fraud.
* Avoid modifications to the current order calculation engine.

---

# 3. User Roles

The marketplace will contain the following user roles:

* Customer
* Vendor
* Delivery Partner
* Admin
* Influencer

---

# 4. Influencer Registration

Influencers can register through a dedicated portal.

### Registration Details

Personal Information

* Full Name
* Email
* Mobile Number
* Password

Professional Information

* Profile Photo
* Bio
* Category/Niche
* Followers Count

Social Accounts

* Instagram
* YouTube
* Facebook
* LinkedIn
* Website

Verification

* PAN
* Aadhaar
* Bank Account
* UPI ID

---

# 5. Approval Workflow

```text
Influencer Registration

↓

Application Submitted

↓

Admin Review

↓

Approved / Rejected

↓

Dashboard Activated
```

Only approved influencers can generate affiliate links.

---

# 6. Admin Panel

## Influencer Management

* Pending Applications
* Approved Influencers
* Rejected Applications
* Suspended Influencers

## Commission Management

* Global Commission Limits
* Vendor Commission Settings
* Commission Reports

## Wallet & Payout

* Pending Withdrawals
* Approved Withdrawals
* Payment History

## Reports

* Top Influencers
* Top Products
* Vendor Performance
* Commission Reports

---

# 7. Vendor Panel

New Module

```
Marketing

└── Influencer Program
```

Vendor can:

* Enable/Disable Influencer Program
* Set Default Commission
* View Influencer Sales
* View Pending Commission
* View Paid Commission
* View Reserved Commission

---

# 8. Commission Configuration

## Commission Decision Model

Porutkal will use:

# Admin + Vendor Model

Admin controls the allowed commission range.

Example

```
Minimum Commission

2%

Maximum Commission

20%
```

Vendor selects commission for eligible products within this range.

Example

```
Army Uniform

Commission

12%
```

Admin can modify or disable commission for any vendor if misuse is detected.

---

# 9. Product Settings

Every product contains:

```
Allow Influencer

YES / NO

Commission

%

Default from Vendor

Editable
```

Only enabled products appear inside the Influencer Marketplace.

---

# 10. Influencer Dashboard

Modules

```
Dashboard

Browse Products

Affiliate Links

My Store

Commission

Wallet

Withdraw

Analytics

Notifications

Profile

Support
```

---

# 11. Browse Products

Influencer can view

* Product
* Vendor
* Price
* Commission %
* Estimated Earnings
* Rating
* Sales

Generate Affiliate Link

Example

```
https://porutkal.com/product/army-uniform?ref=INF12345
```

**Note:** QR Code generation is **not included** in this implementation.

---

# 12. Storefront

Every influencer receives a personal storefront.

Example

```
porutkal.com/@rahulfashion
```

Displays

* Profile
* Bio
* Products
* Categories
* Ratings
* Followers

---

# 13. Customer Journey

```
Influencer

↓

Shares Affiliate Link

↓

Customer Opens Product

↓

Referral Stored

↓

Customer Places Order

↓

Order Completed
```

---

# 14. Referral Tracking

Track

* Influencer
* Customer
* Vendor
* Product
* Order
* Click Time
* Order Time
* Device
* IP Address

---

# 15. Commission Lifecycle

```
Customer Orders

↓

Order Delivered

↓

Return Window Ends

↓

Commission Approved

↓

Reserved from Vendor Wallet

↓

Influencer Wallet Credited

↓

Influencer Withdrawal
```

---

# 16. Commission Status

```
Pending

↓

Approved

↓

Reserved

↓

Transferred

↓

Withdrawn
```

---

# 17. Wallet Architecture

This module uses the existing wallet system.

No changes are required in:

* Order Calculations
* Payment Gateway
* Checkout
* Escrow

---

# 18. Vendor Wallet Enhancement

Add two new fields:

```
Vendor Wallet

Balance

₹1,20,000

Reserved

₹30,000

Withdrawable

₹90,000
```

Where

```
Reserved

=

Influencer Commission
```

Reserved balance cannot be withdrawn.

---

# 19. Influencer Payment Architecture

Current System

```
Customer

↓

Order

↓

Escrow

↓

Vendor
```

New System

```
Customer

↓

Order

↓

Vendor Wallet

↓

Reserve Influencer Commission

↓

Vendor Withdraws Remaining

↓

Influencer Wallet
```

### Key Benefits

* No modification in checkout.
* No modification in order calculations.
* No modification in payment gateway.
* Existing wallet system is reused.
* Vendors cannot avoid influencer payments.
* Influencer earnings remain secure.

---

# 20. Influencer Wallet

Wallet shows

```
Pending

Reserved

Available

Withdrawn
```

Example

```
Pending

₹5,000

Reserved

₹18,000

Available

₹15,000

Withdrawn

₹75,000
```

---

# 21. Withdrawal

Influencer requests payout after reaching a minimum threshold.

Example

```
Minimum Withdrawal

₹500
```

Workflow

```
Influencer

↓

Withdrawal Request

↓

Admin Review

↓

Approved

↓

Bank Transfer

↓

Wallet Updated
```

---

# 22. Vendor Commission Ledger

Every commission entry is stored separately.

Example

```
Vendor

ABC Fashion

Influencer

Rahul

Product

Army Uniform

Commission

₹480

Status

Reserved
```

---

# 23. Analytics

Influencer Dashboard

```
Total Clicks

Orders

Revenue Generated

Commission Earned

Conversion Rate

Top Products
```

Vendor Dashboard

```
Sales via Influencers

Top Influencers

Reserved Commission

Paid Commission

ROI
```

Admin Dashboard

```
Top Influencers

Top Vendors

Top Categories

Commission Trends

Monthly Sales

Pending Withdrawals
```

---

# 24. Notifications

Influencer

* Commission Approved
* Wallet Credited
* Withdrawal Approved
* Withdrawal Rejected

Vendor

* New Influencer Sale
* Commission Reserved
* Influencer Payment Completed

Admin

* New Registration
* Withdrawal Request
* Suspicious Activity

---

# 25. Fraud Prevention

* Self-purchases do not earn commission.
* Duplicate referral protection.
* Referral attribution window (e.g., 30 days).
* Last-click attribution.
* Multiple referral conflict resolution.
* Suspicious click monitoring.
* Excessive cancellation monitoring.
* Admin can suspend influencer accounts.
* Admin can disable vendor participation.

---

# 26. Security

* JWT authentication.
* Role-based authorization.
* Referral link validation.
* Encrypted bank details.
* Secure wallet transactions.
* Immutable commission ledger.
* Complete audit logs.
* Wallet reconciliation before payouts.

---

# 27. Database Models

### Influencer

```
_id
name
email
phone
profileImage
bio
followers
socialLinks
bankDetails
walletId
status
createdAt
```

---

### AffiliateLink

```
_id
influencerId
vendorId
productId
slug
clicks
orders
status
createdAt
```

---

### Referral

```
_id
customerId
influencerId
vendorId
productId
orderId
clickedAt
orderedAt
commission
status
createdAt
```

---

### InfluencerCommission

```
_id
orderId
vendorId
influencerId
productId
commissionPercentage
commissionAmount
status
reservedAt
releasedAt
```

---

### Withdrawal

```
_id
influencerId
walletId
amount
bankDetails
status
requestedAt
approvedAt
```

---

# 28. Complete Business Flow

```text
Vendor Enables Influencer Program
            │
            ▼
Vendor Sets Product Commission
            │
            ▼
Admin Validates Commission Range
            │
            ▼
Influencer Browses Eligible Products
            │
            ▼
Generates Affiliate Link
            │
            ▼
Shares on Instagram / YouTube / Facebook / WhatsApp
            │
            ▼
Customer Clicks Referral Link
            │
            ▼
Referral Recorded
            │
            ▼
Customer Places Order
            │
            ▼
Vendor Ships Product
            │
            ▼
Order Delivered
            │
            ▼
Return Window Ends
            │
            ▼
Commission Approved
            │
            ▼
Reserve Commission from Vendor Wallet
            │
            ▼
Vendor Withdrawable Balance Updated
            │
            ▼
Influencer Wallet Credited
            │
            ▼
Influencer Requests Withdrawal
            │
            ▼
Admin Approves Payout
            │
            ▼
Bank Transfer Completed
```

---

# 29. Advantages of This Architecture

* ✅ No changes to the existing checkout flow.
* ✅ No modifications to order amount calculations.
* ✅ Reuses the existing wallet and settlement system.
* ✅ Prevents vendors from avoiding influencer payments by reserving commission before vendor withdrawal.
* ✅ Supports future promotional campaigns and custom commission rates.
* ✅ Scales cleanly for thousands of influencers and vendors.
* ✅ Provides complete financial transparency through commission ledgers and wallet history.
* ✅ Keeps the marketplace in control while giving vendors flexibility within admin-defined limits.
