---
name: Branch route semantics
description: Domain rule for representing optional intermediate route points on wiring branches.
---

A branch connects a starting node to an ending node and may pass through zero or more tracing points in a defined order.

**Why:** The user clarified this domain requirement.

**How to apply:** Keep endpoint nodes separate from the ordered intermediate trace-point sequence, and preserve that sequence in UI and API behavior.
