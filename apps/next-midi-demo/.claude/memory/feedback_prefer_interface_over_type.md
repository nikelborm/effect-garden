---
name: feedback_prefer_interface_over_type
description: Prefer `interface` (with extends) over `type =` for anything representable as an interface; reserve `type` for unions/tuples/literals
metadata:
  type: feedback
---

Prefer an `interface _ [extends _2] { ... }` declaration over a `type _ = ...` alias for everything that can be expressed as an interface (object shapes, including ones built by extending other types).

**Why:** An `interface` creates a named language token that TypeScript can cache internally — it improves type-checker performance and produces better, named types in errors/hovers. `type` aliases are structurally expanded and don't get the same caching.

**How to apply:**
- Object shapes → `interface Foo { ... }`.
- Extending/combining object types → `interface Foo extends Bar, Baz { ... }` instead of `type Foo = Bar & Baz & { ... }`.
- Only use `type _ = ` for things an interface cannot represent: unions, tuples, mapped types, conditional types, primitive/literal aliases, etc.

Relates to [[feedback_schema_type_accessor]] (both are about how we surface/name types).
