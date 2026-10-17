---
name: Database availability behavior
description: The app's SQLite storage and persistence constraints.
---

ElectroTreesConnection is a free, non-commercial app, and its processed data is not confidential. The SQLite database file should be included in Git and in the deployment archive. The application should use real records and preserve clear loading/error states rather than substituting mock records. SQLite files in published Replit apps are temporary and runtime changes can be lost when the deployment restarts, is republished, or scales to zero.

**Why:** The user explicitly said the app is free/non-commercial, the data does not need confidentiality, and the SQLite file should not be excluded from Git or deployment archives.

**How to apply:** Do not ignore the SQLite file for Git or deployment. Remember that records changed at runtime in the published app may be lost on restart; make that persistence limitation clear if relevant.