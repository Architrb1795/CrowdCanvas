# API & Server Actions Reference

CrowdCanvas primarily utilizes **Next.js Server Actions** for backend mutations instead of traditional REST API routes. This ensures type safety and prevents exposing API logic directly to the client.

## Core Server Actions (`lib/actions/`)

### `events.ts`
- **`getEvents()`**: Fetches all events the current user is authorized to view.
- **`createEvent(formData)`**: Provisions a new event and automatically assigns the creator as the `owner`.
- **`updateEventDetails(eventId, formData)`**: Updates metadata and watermark configurations. Requires `owner` or `admin` role.
- **`deleteEvent(eventId)`**: Safely removes an event using the service role admin client. Requires `owner` role.

### `media.ts`
- **`uploadMedia(formData)`**: Processes a new image upload, triggering background AI jobs.
- **`deleteMedia(mediaId)`**: Securely removes media and associated vector embeddings using the service role client.
- **`saveMediaCopy(mediaId)`**: Duplicates an image into the public domain.

### `faces.ts`
- **`enrollFaceProfile(descriptor)`**: Securely saves a user's facial vector embedding to the `user_face_profiles` table.
- **`matchFaces(descriptors)`**: Performs cosine similarity search using `pgvector` to identify matching users in uploaded media.

### `ai.ts`
- **`processMediaTags(mediaId, imageUrl)`**: Invokes Google Gemini Vision to extract visual context, scene description, and text (via OCR) from the image.
- **`semanticSearch(query)`**: Converts a text query into an embedding using Xenova Transformers and searches the database for matching media.

## Next.js API Routes (`app/api/`)

### `auth/callback`
- **Method**: `GET`
- **Description**: Handles Supabase OAuth redirect and session exchange. It verifies user IPs, logs device types to `user_sessions`, and dispatches first-time login notification emails via Resend.
