# Security & Privacy

CrowdCanvas deals with highly sensitive data: personal event photos, facial recognition biometrics, and private event metadata. Security is not an afterthought; it is built into the core database and application architecture.

## 1. Authentication & Authorization

Authentication is handled completely by **Supabase Auth**.
*   We do not store passwords. We support OAuth (Google/GitHub) and Magic Links.
*   Session state is managed via secure HTTP-only cookies in Next.js Server Actions.

Authorization is enforced at the database level using **Row Level Security (RLS)**. Even if an API endpoint is accidentally exposed, the database will reject unauthorized queries.

**RLS Policy Example:**
```sql
CREATE POLICY "Event members can view private media" ON media FOR SELECT USING (
    EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = media.event_id AND event_members.user_id = auth.uid())
);
```

## 2. Privacy Settings & Granular Controls

Users have a dedicated `user_privacy_settings` record that dictates how the system interacts with their identity.

*   **`disable_tagging`:** If true, the system will *never* attempt to match their face against newly uploaded media.
*   **`require_tag_approval`:** If true, when the AI recognizes their face, the tag is created with a status of `'pending'`. The user receives a notification and must explicitly click "Approve" before the tag becomes visible to others.
*   **`hide_tagged_photos`:** Allows users to be tagged for personal organization, but prevents those photos from showing up publicly on their profile.

## 3. Face Biometrics Security

The `face_profiles` table stores facial descriptors.
*   **It does NOT store images of faces.** It stores a mathematical vector (128 dimensions). It is impossible to reverse-engineer a photograph from this vector.
*   RLS ensures a user can only ever select or update their *own* vector.

## 4. Media Watermarking

Event owners can protect the intellectual property of their event's media through the Watermarking engine.
*   When enabled on an event (`watermark_enabled = true`), the application injects Cloudinary transformation parameters into the media URL.
*   This applies a dynamic, non-destructive watermark (e.g., event logo, copyright text) across the image when it is requested by the client.
*   The raw, un-watermarked image remains securely locked in the Cloudinary bucket, accessible only via signed URLs to authorized admins.
