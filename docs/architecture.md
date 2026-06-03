# Architecture Overview

CrowdCanvas utilizes a modern, serverless-first, edge-compatible architecture designed to handle heavy media processing and AI inference without degrading the core user experience.

## High-Level System Design

### 1. Frontend Layer
*   **Next.js 16 (App Router):** The foundation of the platform. We heavily rely on React Server Components (RSC) to reduce client-side bundle size, fetching initial database state on the server.
*   **Tailwind CSS v4 & Framer Motion:** Used for building a highly responsive, glassmorphism-styled UI with complex micro-interactions (like the Lightbox and Notification overlays).

### 2. Backend Layer
*   **Server Actions (`lib/actions/*`):** Next.js Server Actions handle all data mutations (CRUD operations). This removes the need for traditional REST API routes for most application logic, improving type safety between client and server.
*   **API Routes (`app/api/*`):** Dedicated Next.js API Routes handle webhooks, external integrations, and heavy long-running AI processing tasks (like batch face recognition).

### 3. Storage Layer
*   **PostgreSQL (Supabase):** The primary relational database. It is highly normalized and relies entirely on Row Level Security (RLS) for authorization.
*   **pgvector:** An extension installed on the Supabase database that allows us to store high-dimensional vectors (up to 768 dimensions for semantic search, 128 dimensions for face profiles).
*   **Cloudinary:** Raw media is never stored in Supabase Storage. Instead, it goes directly to Cloudinary. This offloads image transformations (resizing, watermarking, format conversion to webp/avif) to a dedicated CDN.

---

## The AI Pipeline

The AI pipeline is arguably the most complex architectural component of CrowdCanvas.

### A. Media Ingestion & Processing
1.  **Upload:** User selects an image. It is uploaded directly to Cloudinary via a signed URL.
2.  **Metadata Extraction:** `exifr` extracts EXIF data (date, camera model) if available.
3.  **OCR (Optical Character Recognition):** `tesseract.js` scans the image for text.
4.  **Generative Description:** Google Gemini (`@google/genai`) looks at the image and generates a rich JSON payload containing a caption, summary, detected objects, mood, and scene classification.
5.  **Vector Embedding:** The generated AI summary is run through `@xenova/transformers` locally on the server to generate a 768-dimensional text embedding.
6.  **Storage:** The media record is saved to the database along with its tags, OCR text, JSON objects, and the 768d vector.

### B. Face Recognition Engine
1.  **Face Profile Creation:** A user opts-in to facial recognition. They upload selfies.
2.  **Enrollment:** `@vladmandic/face-api` (running in a Node.js environment via `canvas`) detects faces, extracts landmarks, and computes a 128-dimensional face descriptor. This is stored in `face_profiles`.
3.  **Background Scanning:** When a new event photo is uploaded, a background job scans it for faces, generates 128d descriptors for every face found, and stores them in `media_faces`.
4.  **Vector Math (Matching):** Supabase uses the `<=>` cosine distance operator (via RPC function `match_faces`) to compare the `media_faces` vectors against known `face_profiles` vectors.
5.  **Tagging:** If similarity exceeds a defined threshold (e.g., > 0.60), a `photo_user_tags` record is created.

---

## The Recommendation Engine

The recommendation engine powers the "PersonalizedDashboard". 

*   **Signals:** The engine tracks implicit signals (views, dwell time) and explicit signals (likes, shares, comments, favorites, pins) in the `user_behavior_events` table.
*   **Weighting:** A `recommendation_weights_config` table defines the importance of different matches (e.g., matching tags = 35%, matching OCR text = 10%).
*   **Scoring:** When recommending content, the engine queries `user_preference_profiles` and uses vector similarity (`match_media`) combined with a time-decay algorithm (favoring newer media) to generate a customized score for each piece of media.
