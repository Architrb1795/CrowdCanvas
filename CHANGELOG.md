# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-05

### Added
- **Authentication**: Supabase-powered OAuth (Google, GitHub) and Magic Link login.
- **Event Management**: Create events, manage member roles (Admin, Photographer, Member, Viewer), configure visibility and watermark settings.
- **Media Gallery**: Upload, view, delete, and copy media to the public gallery.
- **Social Features**: Commenting, liking, tagging, and bookmarking systems.
- **AI Integration**:
  - Facial recognition using `@vladmandic/face-api` to find user photos.
  - Auto-tagging using Google Gemini (GenAI).
  - Semantic Search utilizing `@xenova/transformers`.
  - OCR capability using `tesseract.js` for text extraction.
- **Notifications**: In-app notifications and Resend-based email alerts.

### Fixed
- Fixed backend parsing logic to gracefully handle optional event parameters and prevent trim crashes.
- Ensured proper Cloudinary widget closure on upload success.

### Security
- RLS policies configured on all primary Supabase tables.
- `NEXT_PUBLIC_` scopes restricted safely.
- Introduced proper service role isolation for protected API routes.
