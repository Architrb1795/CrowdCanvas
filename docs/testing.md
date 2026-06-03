# Testing Guidelines

*(This document serves as a placeholder for future testing implementation)*

Testing a complex AI-driven application like CrowdCanvas requires a multi-layered approach.

## Recommended Testing Stack

*   **Unit Testing:** `Vitest` or `Jest` for testing individual utility functions (e.g., recommendation scoring logic in `lib/recommendation/scoring.ts`).
*   **Component Testing:** `React Testing Library` for ensuring UI components render correctly and handle interactions (e.g., clicking the "Pin Event" button).
*   **End-to-End (E2E) Testing:** `Cypress` or `Playwright` for simulating complete user flows, such as:
    1.  Logging in.
    2.  Creating an event.
    3.  Uploading a photo.
    4.  Verifying the photo appears in the gallery.

## Mocking AI Responses

When testing the AI and Face Recognition pipelines, it is crucial to mock the external dependencies to prevent tests from being slow, flaky, or costing API credits.

*   **Mocking Gemini:** Override the `@google/genai` client to return a deterministic JSON payload.
*   **Mocking Face-API:** Intercept calls to `@vladmandic/face-api` and return a static 128-dimensional array (e.g., `[0.1, 0.2, 0.3...]`) to simulate a face descriptor.

## Running Tests

*Scripts will be added to `package.json` once the testing framework is initialized.*
