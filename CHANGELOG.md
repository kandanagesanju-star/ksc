# Changelog

All notable changes to this project will be documented in this file.

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
