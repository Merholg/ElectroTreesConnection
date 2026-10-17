---
name: Database availability behavior
description: The app's SQLite storage and persistence constraints.
---

ElectroTreesConnection uses a local SQLite database file created by the Flask API. The application should use real records and preserve clear loading/error states rather than substituting mock records. SQLite files in published Replit apps are temporary and can be lost when the deployment restarts, is republished, or scales to zero.

**Why:** The user selected SQLite for this project after learning the published filesystem is not durable; preserving the constraint prevents future code from silently implying production data is durable.

**How to apply:** Keep development data in the ignored SQLite file and never commit it. Before treating the app as production-ready for durable records, move persistence to a durable database or storage system with the user's approval.