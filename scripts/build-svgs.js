// Builds the two animated SVGs for the GitHub profile README:
//   header.svg  digital rain behind an ASCII name and slow typing lines
//   fetch.svg   a neofetch-style ASCII card with a candle (Wick) logo
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
    { text: '> Data analytics. Machine learning. Web apps.', begin: 1.8, y: 236 },
    { text: '> Now shipping: Wick.', begin: 7.6, y: 266 }
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

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Hassan Asiri. Data analytics. Machine learning. Web apps. Now shipping: Wick.">
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

// ---------- fetch.svg ----------
function fetchCard() {
  const W = 900
  const H = 330
  const logo = [
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
  const charW = 9.6
  const lx = 40
  const logoSvg = logo
    .map(
      ([t, k], i) =>
        `<text x="${lx}" y="${46 + i * 18}" fill="${colors[k]}" class="${k === 'f' ? 'flame' : ''}" textLength="${(t.length * charW).toFixed(1)}" lengthAdjust="spacingAndGlyphs" xml:space="preserve">${esc(t)}</text>`
    )
    .join('')

  const info = [
    ['hassan', '@github', 'title'],
    ['-------------', '', 'rule'],
    ['Focus', 'Data analytics, web apps'],
    ['Languages', 'Python, TypeScript, Java'],
    ['Data', 'pandas, scikit-learn, Power BI'],
    ['Web', 'React, Next.js, FastAPI'],
    ['Tools', 'VS Code, Git, Docker'],
    ['Live', 'Wick, estimate-456'],
    ['Editor', 'VS Code'],
    ['Shell', 'PowerShell']
  ]
  const ix = 300
  let rows = ''
  info.forEach(([k, v, kind], i) => {
    const y = 46 + i * 21
    const delay = (0.4 + i * 0.18).toFixed(2)
    let body
    if (kind === 'title') {
      body = `<tspan fill="#3fb950" font-weight="700">${k}</tspan><tspan fill="#8b949e">${v}</tspan>`
    } else if (kind === 'rule') {
      body = `<tspan fill="#8b949e">${k}</tspan>`
    } else {
      body = `<tspan fill="#3fb950" font-weight="700">${esc(k)}</tspan><tspan fill="#8b949e">: ${esc(v)}</tspan>`
    }
    rows += `<text x="${ix}" y="${y}" class="row" style="animation-delay:${delay}s" xml:space="preserve">${body}</text>`
  })
  const swatches = ['#484f58', '#f85149', '#3fb950', '#d29922', '#58a6ff', '#bc8cff', '#39c5cf', '#b1bac4']
  const sy = 46 + info.length * 21 + 6
  const swDelay = (0.4 + info.length * 0.18).toFixed(2)
  const sw = swatches
    .map((c, i) => `<rect x="${ix + i * 30}" y="${sy}" width="28" height="16" fill="${c}"/>`)
    .join('')
  const promptY = sy + 44
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Hassan Asiri. Focus: data analytics and web apps. Languages: Python, TypeScript, Java.">
<title>hassan@github</title>
<style>
  text { font: 16px ${MONO}; }
  .row, .swatches, .prompt { opacity: 0; animation: show .35s ease-out forwards; }
  @keyframes show { to { opacity: 1; } }
  .flame { transform-box: fill-box; transform-origin: 50% 100%; animation: flicker 2.6s ease-in-out infinite; }
  @keyframes flicker { 0%,100% { transform: scale(1,1) skewX(0deg); } 30% { transform: scale(.97,1.04) skewX(-3deg); } 60% { transform: scale(1.02,.98) skewX(2deg); } }
  .cursor { animation: blink 1s steps(1) infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .flame, .cursor { animation: none; } .row, .swatches, .prompt { opacity: 1; animation: none; } }
</style>
${logoSvg}
${rows}
<g class="swatches" style="animation-delay:${swDelay}s">${sw}</g>
<g class="prompt" style="animation-delay:${(Number(swDelay) + 0.3).toFixed(2)}s"><text x="${ix}" y="${promptY}" xml:space="preserve"><tspan fill="#3fb950">hassan@github</tspan><tspan fill="#8b949e">:~$ </tspan></text><rect class="cursor" x="${ix + 18 * charW + 2}" y="${promptY - 14}" width="9" height="18" fill="#3fb950"/></g>
</svg>
`
}

fs.writeFileSync(path.join(out, 'header.svg'), matrix())
fs.writeFileSync(path.join(out, 'fetch.svg'), fetchCard())
console.log('written to', out)
