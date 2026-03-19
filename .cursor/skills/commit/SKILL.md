---
name: commit
description: >-
  Verifies whether the working tree is in good shape for a git commit, fixes
  common issues (noise comments, mixed-language comments), and proposes example
  commit messages. Use when the user asks about committing, commit readiness,
  a commit message, or invokes a /commit-style workflow.
---

# Commit readiness and message

## When this applies

User wants to commit, asks if the repo is “ready”, or requests an example **commit message**.

## Workflow

### 1. Quick hygiene scan (fix if needed)

In source files the user cares about (e.g. `*.html`, `*.css`, `*.js`, `*.ts`, `*.tsx`, `*.cs`):

- Remove **unnecessary comments**: section dividers that add no information, commented-out dead code, redundant explanations obvious from code.
- **Polish (or other non-English) comments in code** intended for a shared / professional repo:
  - Prefer **English** for inline comments in code, or **remove** if the code is self-explanatory.
  - **User-facing copy** (i18n strings, visible UI text) stays in the product languages (e.g. PL/EN via i18n) — do not “translate away” intentional localization.
- Remove stray **`console.log`**, **`debugger`**, temporary **`TODO`** unless the team keeps them tracked.
- **Do not** strip license headers, legal notices, or `eslint-disable` / `pragma` lines that are required for tooling.

Apply edits in the repo; then summarize what changed.

### 2. If already clean

Skip fixes; say briefly that nothing blocking was found.

### 3. Commit message

Propose **1–3 short example messages** in **English** (common for git history), using a clear prefix when useful:

- `feat:` — feature
- `fix:` — bugfix
- `refactor:` / `style:` — structure or formatting
- `docs:` — README, comments-only docs
- `chore:` — tooling, deps, cleanup

**Format:**

```text
<type>(<optional scope>): <imperative summary under ~72 chars>

Optional body: what and why, not implementation diary.
```

**Examples:**

```text
feat(portfolio): add Gothic Smithy project page with GitHub and video

refactor(css): tighten back-link spacing on project pages

chore: remove debug comments before release
```

## Output to the user

1. **Status**: ready / what was fixed.
2. **Suggested commit message(s)** (copy-paste friendly).
3. Optional: `git add` / `git status` hints only if relevant — no destructive git commands unless the user explicitly asks.

## Anti-patterns

- Do not claim legal or security “approval” to commit — only style and obvious hygiene.
- Do not rewrite **intentional** bilingual content in `i18n` as “comments”; those are data, not code comments.
