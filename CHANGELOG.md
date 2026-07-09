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
