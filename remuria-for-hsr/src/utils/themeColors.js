// Builds a CSS color-mix() value that darkens/lightens a themed CSS custom
// property (e.g. --accent-solid) and adds translucency, so backdrop-blur
// panels can stay theme-colored instead of flat gray/black. Returns a raw
// CSS value for use via inline `style`, NOT a Tailwind class — Tailwind's
// scanner can't see class names assembled at runtime, so this must not be
// wrapped in `bg-[...]` and passed through className.
export function getThemeBgColor({
  colorVar = '--accent-solid',
  mixColor = 'black',
  darkness = 25,
  alpha = 75,
} = {}) {
  return `color-mix(in srgb, color-mix(in srgb, var(${colorVar}) ${darkness}%, ${mixColor}) ${alpha}%, transparent)`;
}
