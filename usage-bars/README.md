# usage-bars

A Claude Code mod that draws two stacked bars above the prompt:

```
Session ████████░░░░░░░░░░░░  42%  resets in 2h 0m (12:00)
Week    ████████████████░░░░  80%  resets in 4d 2h (Thu 12:00)
```

- **Session**: the 5-hour rate-limit window. **Week**: the 7-day window.
- Bars go green → yellow (≥70%) → red (≥90%).
- Reset countdowns refresh every minute; percentages update whenever the engine reports a new rate-limit reading.
- `/usage-bars` toggles the band; the choice is remembered across sessions.

Rate-limit figures are only reported on a Claude subscription, and only after the first response of a session.

## Install

```
claude --plugin-dir /path/to/usage-bars
```

Test: `claude plugin test usage-bars`
