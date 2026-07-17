---
name: Member name display
description: How to get the correct display name for a user across VANTORIS
---

Use `getMemberDisplayName(user, format?)` from `src/lib/memberName.js`.

Priority: `preferred_name` → `full_name` → `'Member'`

Format options:
- `'full'` (default) — full display name, e.g. "Colton Hogan"
- `'first'` — first word only, e.g. "Colton"

Also exports `getGreeting()` for time-appropriate greeting string.

**Why:** Spec explicitly forbids showing email or usernames (e.g. "coltonhogan444") as member names. Greetings should show "Good Morning, Colton Hogan" not an email address.

**How to apply:** Import in any page/component that displays the current user's name. The `Home.jsx` SanctuaryHeader and ConciergeWelcome receive the full display name via the `firstName` prop (prop name is legacy; value is now full display name).
