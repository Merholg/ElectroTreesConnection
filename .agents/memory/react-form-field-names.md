---
name: React form field names
description: Avoid collisions between form control names and built-in DOM properties.
---

Avoid using inherited DOM property names such as `nodeName` as registered HTML form control names. A named control can shadow `HTMLFormElement.nodeName`; React 19 may then crash while handling submission. Use a distinct UI field name and map it to the API field at the submit boundary.

**Why:** Submitting the node-creation form caused `reactName.nodeName.toLowerCase is not a function` in React's event dispatch.

**How to apply:** When an event-dispatch error mentions a DOM property, inspect form control `name` values for collisions with DOM APIs and rename the UI field without changing the API contract.
