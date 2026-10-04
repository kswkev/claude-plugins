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

### From a running Claude Code terminal (no restart)

Type these slash commands at the prompt:

```
/plugin marketplace add kswkev/claude-plugins
/plugin install usage-bars@kswkev-plugins
/reload-plugins
```

The bars show up above the prompt after the next response, once Claude Code has a usage reading.
If you've cloned this repo, you can pass its local path to `/plugin marketplace add` instead
(for example `/plugin marketplace add ~/code/claude-plugins`). The plugin is then read straight
from that folder, so after editing it you only need to run `/reload-plugins`.

To turn it off later: `/plugin disable usage-bars@kswkev-plugins` (or just `/usage-bars` to hide the bars).

### For one launch only

```
claude --plugin-dir /path/to/usage-bars
```

Test: `claude plugin test usage-bars`
