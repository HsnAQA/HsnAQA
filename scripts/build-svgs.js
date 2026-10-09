// Builds the two animated SVGs for the GitHub profile README:
//   rain.svg    digital rain behind an ASCII name and slow typing lines
//   flame.svg   an ASCII candle (Wick) with a flickering flame
// Both have transparent backgrounds and use only system monospace fonts,
// because GitHub serves README images through a proxy without web fonts.
const fs = require('fs')
const path = require('path')
const figlet = require('figlet')

const out = process.argv[2] || '.'
const esc = s =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const MONO = "'Cascadia Mono','Consolas','DejaVu Sans Mono','Menlo','Courier New',monospace"

// Deterministic pseudo-random numbers so rebuilding gives the same image.
let seed = 42
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const pick = s => s[Math.floor(rand() * s.length)]

// ---------- matrix.svg ----------
function matrix() {
  const W = 900
  const H = 330
  const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789ABCDEF'
  const colW = 15
  const cols = Math.floor(W / colW)
  const rowH = 16
  let rain = ''
  for (let c = 0; c < cols; c++) {
    const len = 10 + Math.floor(rand() * 14)
    const dur = (7 + rand() * 9).toFixed(2)
    const delay = (-rand() * 16).toFixed(2)
    const x = c * colW + colW / 2
    let spans = ''
    for (let i = 0; i < len; i++) {
      const head = i === len - 1
      const op = head ? 1 : (0.12 + (i / len) * 0.6).toFixed(2)
      spans += `<tspan x="${x}" dy="${rowH}" fill="${head ? '#d2ffde' : '#3fb950'}" fill-opacity="${op}">${esc(pick(glyphs))}</tspan>`
    }
    // SMIL rather than CSS keeps the rain moving in every browser's <img>.
    rain += `<text>${spans}<animateTransform attributeName="transform" type="translate" from="0 -${len * rowH}" to="0 ${H}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/></text>`
  }

  const art = figlet
    .textSync('HASSAN ASIRI', { font: 'ANSI Shadow' })
    .split('\n')
    .filter(l => l.trim().length)
  const artCols = Math.max(...art.map(l => l.length))
  const artCharW = 7.6
  const artLen = artCols * artCharW
  const artX = (W - artLen) / 2
  const artRows = art
    .map(
      (l, i) =>
        `<text x="${artX}" y="${92 + i * 15}" textLength="${(l.length * artCharW).toFixed(1)}" lengthAdjust="spacingAndGlyphs" xml:space="preserve">${esc(l)}</text>`
    )
    .join('')

  const lines = [
    { text: '> Wake up, Hassan...', begin: 1.8, y: 236 },
    { text: '> Follow the white rabbit.', begin: 7.6, y: 266 }
  ]
  const tCharW = 10.2
  const longest = Math.max(...lines.map(l => l.text.length))
  const tX = (W - longest * tCharW) / 2
  let typing = ''
  let defs = ''
  lines.forEach((l, i) => {
    const n = l.text.length
    const dur = (n * 0.11).toFixed(2)
    const values = Array.from({ length: n + 1 }, (_, k) => (k * tCharW).toFixed(1)).join(';')
    const width = (n * tCharW).toFixed(1)
    defs += `<clipPath id="type${i}"><rect x="${tX}" y="${l.y - 20}" height="28" width="0"><animate attributeName="width" values="${values}" dur="${dur}s" begin="${l.begin}s" calcMode="discrete" fill="freeze"/></rect></clipPath>`
    typing += `<text x="${tX}" y="${l.y}" textLength="${width}" lengthAdjust="spacingAndGlyphs" clip-path="url(#type${i})" xml:space="preserve">${esc(l.text)}</text>`
    const next = lines[i + 1]
    // The cursor follows the line while it types and blinks at its end.
    typing += `<rect class="cursor" y="${l.y - 15}" width="9" height="18" x="${tX}" opacity="0">
      <animate attributeName="x" values="${values.split(';').map(v => (tX + Number(v) + 2).toFixed(1)).join(';')}" dur="${dur}s" begin="${l.begin}s" calcMode="discrete" fill="freeze"/>
      <set attributeName="opacity" to="1" begin="${l.begin - 0.6}s"/>
      ${next ? `<set attributeName="opacity" to="0" begin="${next.begin - 0.6}s"/>` : ''}
    </rect>`
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Hassan Asiri. Wake up, Hassan... Follow the white rabbit.">
<title>Hassan Asiri</title>
<style>
  .rain text { font: 14px ${MONO}; }
  .name { font: 13px ${MONO}; fill: #3fb950; animation: rise 1.6s ease-out both; }
  .glow { font: 13px ${MONO}; fill: #3fb950; opacity: .55; filter: url(#blur); animation: rise 1.6s ease-out both; }
  @keyframes rise { from { opacity: 0; transform: translateY(8px); } }
  .typing { font: 17px ${MONO}; fill: #3fb950; }
  .cursor { fill: #3fb950; animation: blink 1s steps(1) infinite; }
  @keyframes blink { 50% { fill-opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .name, .glow, .cursor { animation: none; } }
</style>
<defs>
  <filter id="blur" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>
  <radialGradient id="fade" cx="50%" cy="52%" r="62%">
    <stop offset="0" stop-color="#fff" stop-opacity=".08"/>
    <stop offset=".55" stop-color="#fff" stop-opacity=".35"/>
    <stop offset="1" stop-color="#fff" stop-opacity=".9"/>
  </radialGradient>
  <linearGradient id="edges" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000"/><stop offset=".12" stop-color="#fff"/>
    <stop offset=".88" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
  </linearGradient>
  <mask id="rainMask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
  <mask id="edgeMask"><rect width="${W}" height="${H}" fill="url(#edges)"/></mask>
  ${defs}
</defs>
<g mask="url(#edgeMask)"><g class="rain" mask="url(#rainMask)">${rain}</g></g>
<g class="glow">${artRows}</g>
<g class="name">${artRows}</g>
<g class="typing">${typing}</g>
</svg>
`
}

// ---------- candle.svg ----------
function candle() {
  const W = 320
  const H = 300
  const art = [
    ['        )', 'f'],
    ['       ) \\', 'f'],
    ['      / ) (', 'f'],
    ['      \\(_)/', 'f'],
    ['       |=|', 'w'],
    ['     .-----.', 'c'],
    ['     |     |', 'c'],
    ['     |     |', 'c'],
    ['     |     |', 'c'],
    ['     |     |', 'c'],
    ['     |     |', 'c'],
    ['   __|_____|__', 'c'],
    ["  '-----------'", 'c']
  ]
  const colors = { f: '#f0883e', w: '#d29922', c: '#8b949e' }
  const charW = 11.4
  const rowH = 20
  const width = Math.max(...art.map(([t]) => t.length)) * charW
  const x = (W - width) / 2
  const top = 30
  const line = ([t, k], i, cls) =>
    `<text x="${x}" y="${top + 16 + i * rowH}" fill="${colors[k]}" textLength="${(t.length * charW).toFixed(1)}" lengthAdjust="spacingAndGlyphs" xml:space="preserve"${cls ? ` class="${cls}"` : ''}>${esc(t)}</text>`
  const flame = art.filter(([, k]) => k === 'f')
  const body = art.map((row, i) => (row[1] === 'f' ? '' : line(row, i))).join('')
  const flameRows = flame.map((row, i) => line(row, i)).join('')
  const glowX = x + 8.5 * charW
  const glowY = top + 2 * rowH
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="An ASCII candle with a flickering flame">
<title>Wick</title>
<style>
  text { font: 19px ${MONO}; }
  .flame { transform-box: fill-box; transform-origin: 50% 100%; animation: flicker 2.4s ease-in-out infinite; }
  .flame.blur { filter: url(#soft); opacity: .7; }
  @keyframes flicker { 0%,100% { transform: scale(1,1) skewX(0deg); } 25% { transform: scale(.96,1.06) skewX(-4deg); } 55% { transform: scale(1.03,.97) skewX(3deg); } 80% { transform: scale(.98,1.03) skewX(-2deg); } }
  @media (prefers-reduced-motion: reduce) { .flame { animation: none; } }
</style>
<defs>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  <radialGradient id="halo"><stop offset="0" stop-color="#f0883e" stop-opacity=".35"/><stop offset="1" stop-color="#f0883e" stop-opacity="0"/></radialGradient>
</defs>
<ellipse cx="${glowX.toFixed(1)}" cy="${glowY}" rx="90" ry="70" fill="url(#halo)">
  <animate attributeName="opacity" values=".75;1;.6;.95;.75" dur="2.4s" repeatCount="indefinite"/>
</ellipse>
${body}
<g class="flame blur">${flameRows}</g>
<g class="flame">${flameRows}</g>
</svg>
`
}
fs.writeFileSync(path.join(out, 'rain.svg'), matrix())
fs.writeFileSync(path.join(out, 'flame.svg'), candle())
console.log('written to', out)
