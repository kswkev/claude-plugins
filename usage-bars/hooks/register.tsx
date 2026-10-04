import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { UsageWindow } from '../types'

const windows = atom({ plugin: 'usage-bars', key: 'windows' } as const, [])
const isShown = atom({ plugin: 'usage-bars', key: 'isShown' } as const, true)
const now = atom({ plugin: 'usage-bars', key: 'now' } as const, 0)

const ROWS = [
  { kind: 'five_hour', label: 'Session' },
  { kind: 'seven_day', label: 'Week' },
] as const

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const LABEL_WIDTH = 8
const PCT_WIDTH = 5

export function barColor(pct: number): string {
  if (pct >= 90) return 'red'
  if (pct >= 70) return 'yellow'
  return 'green'
}

export function bar(pct: number, width: number): [string, string] {
  const filled = Math.round((Math.min(Math.max(pct, 0), 100) / 100) * width)
  return ['█'.repeat(filled), '░'.repeat(width - filled)]
}

export function resetText(resetsAt: string | undefined, nowMs: number): string {
  if (!resetsAt) return 'reset time unknown'
  const at = Date.parse(resetsAt)
  if (Number.isNaN(at)) return 'reset time unknown'
  const mins = Math.max(0, Math.round((at - nowMs) / 60000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  const span = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`
  const when = new Date(at)
  const hh = String(when.getHours()).padStart(2, '0')
  const mm = String(when.getMinutes()).padStart(2, '0')
  const day = DAYS[when.getDay()]
  return `resets in ${span} (${d > 0 ? `${day} ` : ''}${hh}:${mm})`
}

const toWindows = (list: readonly UsageWindow[]): UsageWindow[] =>
  list.map(w => ({ kind: w.kind, percentUsed: w.percentUsed, resetsAt: w.resetsAt }))

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'usage-bars',
      description: 'Toggle the session/week usage bars above the prompt',
      immediate: true,
    })

    const stored = await $.store.get('isShown')
    if (typeof stored === 'boolean') await update($, isShown, () => stored)

    const startedAt = await $.clock.now()
    await update($, now, () => startedAt)
    const usage = await $.session.usage()
    if (usage.rateLimits.length > 0) {
      await update($, windows, () => toWindows(usage.rateLimits))
    }

    // Keep the reset countdowns fresh.
    $.clock.every(60_000, () => {
      void $.clock.now().then(t => update($, now, () => t))
    })

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) {
      await update($, windows, () => toWindows(e.rateLimits))
      const t = await $.clock.now()
      await update($, now, () => t)
    }
    return next(e)
  })

  on('command.run', { command: 'usage-bars' }, async $ => {
    const shown = !(await read($, isShown))
    await update($, isShown, () => shown)
    await $.store.set('isShown', shown)
    return { text: `Usage bars ${shown ? 'shown' : 'hidden'}.` }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, isShown))) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const list = await read($, windows)
    const nowMs = (await read($, now)) || (await $.clock.now())

    if (list.length === 0) {
      return (
        <Box>
          <Text dimColor>Usage bars: waiting for the first rate-limit reading (subscription only)…</Text>
        </Box>
      )
    }

    const columns = e.props.bodyColumns || 80
    const width = Math.max(10, Math.min(40, columns - LABEL_WIDTH - PCT_WIDTH - 40))

    return (
      <Box flexDirection="column">
        {ROWS.map(row => {
          const w = list.find(one => one.kind === row.kind)
          if (!w) {
            return (
              <Box key={row.kind}>
                <Text bold>{row.label.padEnd(LABEL_WIDTH)}</Text>
                <Text dimColor>no data yet</Text>
              </Box>
            )
          }
          const [full, empty] = bar(w.percentUsed, width)
          return (
            <Box key={row.kind}>
              <Text bold>{row.label.padEnd(LABEL_WIDTH)}</Text>
              <Text color={barColor(w.percentUsed)}>{full}</Text>
              <Text dimColor>{empty}</Text>
              <Text bold> {`${Math.round(w.percentUsed)}%`.padStart(PCT_WIDTH - 1)}</Text>
              <Text dimColor>  {resetText(w.resetsAt, nowMs)}</Text>
            </Box>
          )
        })}
      </Box>
    )
  })
}
