# SvelteKit Example App for A/BBY

This example application showcases the features of **[A/BBY](https://tryabby.com)** with **SvelteKit**.

## Features Demonstrated

- **A/B Testing (`useAbby`)**: Dynamic variants with class lookups, bucket persistence via cookies, and conversion tracking via `onAct()`.
- **Feature Flags (`useFeatureFlag`)**: Reactive boolean feature flag toggles (e.g., promotional banner).
- **Remote Config (`useRemoteConfig`)**: Dynamically loaded headlines and copy text from remote configuration.
- **Variant Reset (`getABResetFunction`)**: Reset user buckets on demand.
- **Server-Side Integration (`withAbby` & `AbbyProvider`)**: Zero-flicker SSR hydration and cookie management.

## Getting Started

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Set your `PUBLIC_ABBY_PROJECT_ID` in `.env` (or use the provided default demo project).

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Build for production:
   ```bash
   pnpm build
   ```
