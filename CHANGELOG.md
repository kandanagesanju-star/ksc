# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-07-11

### Added
- Created `SuperAdminDashboard.tsx` component to manage business tenants (view counts, last active times, active/suspended status, manual onboarding).
- Created `/functions/api/admin.ts` Super Admin endpoint supporting list retrieval, tenant status toggling, and new shop registration using a secure Master Admin Key.
- Integrated SaaS Subscription Suspension check in `App.tsx` cloud sync polling and startup mounting.
- Designed premium glassmorphic "System Suspended" blocking screen in English and Sinhala to deactivate delinquent tenants.
- Configured dynamic routing to Super Admin panel via `?view=super-admin` query string.
- Implemented **Local Storage Fallback Simulation** in the Super Admin Dashboard and subscription guard to allow full SaaS testing on localhost (Vite-only dev server) without Cloudflare KV configuration.
- Added **Change Master Password/Key** feature in the Super Admin panel to customize access codes dynamically (stored in Cloudflare KV or fallback localStorage).
- Extended the **Register New Shop Client** form in the Super Admin Dashboard to accept owner Email, Phone number, and Shop Access Password.
- Implemented **Dynamic Setup Links & One-Click Onboarding**: Newly generated links automatically configure the client's POS with the correct Shop ID, name, and password upon click.
- Integrated **WhatsApp Onboarding Share Utility**: Super Admins can send complete credentials and the dynamic setup link directly to the shop owner's WhatsApp number.
- Added **Security Access Verification** in the cloud sync backend, enforcing password authentication matching the tenant's generated access key (preventing ID spoofing).
- Added **Subscription Expiry Date Pickers** in the Super Admin Dashboard (Create and Edit forms) to define active periods for shop tenants.
- Implemented **Auto-Deactivation Logic** in Cloudflare API sync endpoints and local fallback simulation: when subscription expires, sync blocks automatically and deactivates client access.
- Designed **SaaS Expiry Warning Banners** in the client POS dashboard, triggering warnings when subscription is within 30 days of expiration (Gold warning for <=30 days, pulsing Amber/Red alert for <=7 days).

## [Unreleased] - 2026-07-09

### Added
- Created `CHANGELOG.md` to track development changes.
- Renamed System Settings sub-tab from "Database Backup" (දත්ත ගබඩා ආරක්ෂාව) to "Database & Security" (දත්ත සහ ආරක්ෂාව) to resolve duplicate naming confusion with the main sidebar menu item.
- Translated Settings sub-tabs dynamically to support English and Sinhala localization.
- Translated the Database Integrity Health Check card in `SettingsPanel.tsx` to support Sinhala.
- Revamped the main "Database Backup" screen in `App.tsx` with a modern, glassmorphic layout displaying current database table counts (statistics).
- Implemented robust JSON schema validation in `handleImportBackup` to prevent corrupted files from crashing local storage.
- Designed a side-by-side data comparison modal overlay that shows Current vs. Backup record counts (Products, Sales, Customers, Repairs, etc.) with a checkbox confirm step before restoring/overwriting database content.
- Implemented Database Storage Footprint Tracker in `SettingsPanel.tsx` showing active memory usage with a visual progress bar.
- Added Log Archival & Purge Maintenance utilities to filter out audit logs older than 30 or 90 days.
- Added Secure Database Factory Reset feature authenticated by Admin Passcode PIN to erase local storage and reload.
- Implemented **Global Font Size Resizing Controller** scaling root HTML `rem` units dynamically between Small (`14px`), Base (`16px`), Large (`18px`), and Extra Large (`20px`) for customized readability.
- Implemented **Product Catalog Layout Switchers** allowing users to switch product view layouts dynamically between "Tiles", "List", "Icons", and "Details" inside the POS Terminal, Central Inventory panel, and KSC Online Storefront.
- Added **Floating Search Suggestions Dropdown** to the KSC Online Storefront search bar to suggest matching products as customers type.
- Integrated **Product Quick View Modal** in the storefront for instant detailed specs, stock level checks, reviews list, and quick order pathways.
