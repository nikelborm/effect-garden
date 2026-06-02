export const themes = ['dark', 'light'] as const
export type Theme = (typeof themes)[number]
