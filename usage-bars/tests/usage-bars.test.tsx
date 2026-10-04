import { expect, mock, test } from 'claude-code/testing'
import type { RenderPropsOf } from 'claude-code'

import { bar, barColor, resetText } from '../hooks/register'

test('bar fills proportionally and clamps', async () => {
  expect(bar(50, 10)).toEqual(['█████', '░░░░░'])
  expect(bar(0, 4)).toEqual(['', '░░░░'])
  expect(bar(130, 4)).toEqual(['████', ''])
})

test('colors escalate with usage', async () => {
  expect(barColor(10)).toBe('green')
  expect(barColor(75)).toBe('yellow')
  expect(barColor(95)).toBe('red')
})

test('reset text shows a countdown', async () => {
  const now = Date.parse('2026-10-04T10:00:00Z')
  expect(resetText('2026-10-04T12:30:00Z', now)).toMatch(/^resets in 2h 30m \(\d\d:\d\d\)$/)
  expect(resetText('2026-10-07T10:00:00Z', now)).toMatch(/^resets in 3d 0h \(\w{3} \d\d:\d\d\)$/)
  expect(resetText(undefined, now)).toBe('reset time unknown')
})

test('/usage-bars toggles the band', async ($, on) => {
  on('command.register', () => ({ value: undefined }) as never)
  on('session.start', () => ({ sessionId: 'test', cwd: '/tmp' }) as never)
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  mock.store(on)
  mock.clock(on, { now: Date.parse('2026-10-04T10:00:00Z') })
  on('session.usage', () => ({ value: { startedAt: 0, context: {}, rateLimits: [
    { kind: 'five_hour', percentUsed: 42, resetsAt: '2026-10-04T12:00:00Z' },
    { kind: 'seven_day', percentUsed: 80, resetsAt: '2026-10-08T12:00:00Z' },
  ] } }) as never)
  await $.session.start({ source: 'startup', cwd: '/tmp' } as never)
  const props = {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 100,
  } as unknown as RenderPropsOf['AbovePrompt']
  const band = () =>
    $.ui.mount({ plugin: 'usage-bars', surface: 'terminal', component: 'AbovePrompt', props })

  let ui = await band()
  expect(await ui.find({ type: 'Text', text: /42%/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /80%/ })).toBeDefined()
  await ui.unmount()

  const off = await $.command.run({ command: 'usage-bars' } as never)
  expect(off.text).toBe('Usage bars hidden.')
  ui = await band()
  expect(await ui.find({ type: 'Text', text: /42%/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: 'engine' })).toBeDefined()
  await ui.unmount()

  const shown = await $.command.run({ command: 'usage-bars' } as never)
  expect(shown.text).toBe('Usage bars shown.')
})
