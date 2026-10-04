export type UsageWindow = { kind: string; percentUsed: number; resetsAt?: string }

declare module 'claude-code' {
  interface PluginState {
    'usage-bars': { windows: UsageWindow[]; isShown: boolean; now: number }
  }
}
