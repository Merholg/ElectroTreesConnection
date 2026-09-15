---
name: Database availability behavior
description: The app's behavior when the configured MySQL service cannot be reached.
---

The application must keep database connectivity explicit: Flask may start, but health and data endpoints should report a clear 503 until the configured MySQL service is reachable. The frontend should show loading/error states rather than substituting mock records.

**Why:** The product is intended to visualize and edit the user's electrical connection tree, so fabricated data could be mistaken for real panel topology.

**How to apply:** Preserve the MySQL-only data path when changing API or UI behavior. If local development lacks MySQL, fix the environment connection as a separate step instead of adding a silent fallback.