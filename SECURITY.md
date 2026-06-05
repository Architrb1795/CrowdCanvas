# Security Policy

## Supported Versions

Currently, CrowdCanvas is in its early stages of development and release. 
The following versions are actively supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

Security is a priority for us. If you discover a vulnerability, we would like to know about it so we can take steps to address it as quickly as possible.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them to us via email. You can contact the lead maintainer: Archit Bagayatkar.

Please include the following information in your report:
- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof of concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

This project follows responsible disclosure practices.

## Best Practices Followed
- All sensitive keys (Supabase Service Role, Google Gemini Key) are strictly server-only.
- Row Level Security (RLS) policies are active on the database.
- `.env` files are ignored in Git commits to prevent accidental token exposure.
