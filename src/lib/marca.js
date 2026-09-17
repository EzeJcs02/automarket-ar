export const COLOR_MARCA_DEFAULT = '#e63329'

export function colorDe(c) {
  return /^#[0-9a-f]{6}$/i.test(c?.color_marca || '') ? c.color_marca : COLOR_MARCA_DEFAULT
}

export function rgbaMarca(hex, alpha) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
