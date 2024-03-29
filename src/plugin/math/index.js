const tex2svg = require('./tex2svg')
const { AsciiMath } = require('asciimath-parser-nearley')
const fs = require('fs')
const path = require('path')
const child = require('child_process')
const config = require('../../config')
const message = require('../../message')
let svg2png
try {
  svg2png = require('svg2png')
} catch (e) { }

const strings = {
  help: message.mathHelp,
  tooWide: '文字太宽了！下次记得换行咯。',
  // useTex: '您是不是想要使用 /tex 而不是 /am ?',
  aligned: '提示: 使用 \\begin{aligned} \\end{aligned} 换行',
  stupid: '笨！',
}

// customize asciimath
const amParser = new AsciiMath({
  replaceBeforeTokenizing: [
    [/\r\n/g, '\n'],
    [/\r/g, '\n'],
    [/\*\*/g, '^'],
    [/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿ]+)/g, '^($1)'],
    [/([₀₁₂₃₄₅₆₇₈₉₊₋ₙ]+)/g, '_($1)'],
    [/(\p{Unified_Ideograph}+)/ug, '"$1"'], // 汉字用正体, 不用斜体
    [/[⁰₀]/g, '0'],
    [/[¹₁]/g, '1'],
    [/[²₂]/g, '2'],
    [/[³₃]/g, '3'],
    [/[⁴₄]/g, '4'],
    [/[⁵₅]/g, '5'],
    [/[⁶₆]/g, '6'],
    [/[⁷₇]/g, '7'],
    [/[⁸₈]/g, '8'],
    [/[⁹₉]/g, '9'],
    [/[ⁿₙ]/g, 'n'],
    [/（/g, '('],
    [/）/g, ')'],
    [/[＋⁺₊]/g, '+'],
    [/[－⁻₋]/g, '-'],
    [/＊/g, '*'],
    [/／/g, '/'],
    [/＝/g, '='],
    [/≠/g, '!='],
    [/Σ/g, 'sum'],
    [/∏/g, 'prod'],
    [/；/g, ';'],
    [/，/g, ','],
    [/：/g, ':'],
    [/！/g, '!'],
    [/？/g, '?'],
    [/√/g, 'sqrt'],
    [/º/g, '^@'],
  ]
})

// 用 image magick 命令行
async function magick (svg) {
  await fs.promises.writeFile('tmp.svg', svg)
  return new Promise((resolve, reject) => {
    const name = config.image.name || 'tmp.png'
    const imagePath = path.join(config.image.path, name)
    child.exec(`magick ${path.resolve()}/tmp.svg ${imagePath}`, err => {
      if (err) {
        reject(err)
      } else {
        resolve(message.image(imagePath))
      }
    })
  })
}

// 用 svg2png 和 phantom js
async function phantom (svg) {
  const buf = await svg2png(svg)
  const name = config.image.name || 'tmp.png'
  const imagePath = path.join(config.image.path, name)
  await fs.promises.writeFile(imagePath, buf)
  return message.image(imagePath)
}

function contextHelper (src) {
  let isDisplay = false
  return src.split('$$').map(s1 => {
    isDisplay = !isDisplay
    if (!isDisplay) {
      return s1.trim()
    } else {
      let isFormula = false
      return s1.split('$').map(s2 => {
        isFormula = !isFormula
        if (!isFormula) {
          return s2
        } else {
          return s2.split('\n').map(
            s => s ? '\\text{' + s + '}' : s
          ).join('\n')
        }
      }).join('')
    }
  }).join('\n').trim().replace(/\n+/g, '\n')
}

const identical = x => x

function lineHelper (src, fn = identical) {
  if (fn === identical) {
    const buf = []
    let depth = 0
    // 只保留最外层换行
    // 将 \\ 转为换行
    for (let i = 0; i < src.length; ++i) {
      const c = src[i]
      if (i >= 5 && src.slice(i - 5, i + 1) === '\\begin') {
        ++depth
      } else if (i >= 3 && src.slice(i - 3, i + 1) === '\\end') {
        --depth
      }
      if (depth === 0 && c === '\\' && src[i + 1] === '\\') {
        buf.push('\n')
        ++i
      } else if (depth === 0 || c !== '\n') {
        buf.push(c)
      }
    }
    src = buf.join('')
  }
  const convertLine = s => s.includes('&') ? fn(s) : '& ' + fn(s)
  return '\\begin{aligned}' +
    src.split('\n').map(convertLine).join(' \\\\ ') +
    '\\end{aligned}'
}

async function convert (tex) {
  const res = await tex2svg(tex)
  if (res.error) {
    return message.plain(res.error)
  }
  const imageEngine = config.image.engine === 'magick' ? magick : phantom
  const msg = await imageEngine(res.svg)
  if (res.width > res.height * 20) {
    msg.push(message.plain(strings.tooWide)[0])
  }
  return msg
}

let amVersion = ''
async function help () {
  if (!amVersion) {
    try {
      const amPackage = await fs.promises.readFile('node_modules/asciimath-parser-nearley/package.json', 'utf-8')
      amVersion = JSON.parse(amPackage).version
    } catch (e) {
      console.error(e)
    }
  }
  return 'asciimath-parser-nearley ' + amVersion + '\n' + strings.help
}

async function text (src) {
  if (!src) return help()
  src = contextHelper(src)
  src = lineHelper(src)
  return convert(src)
}

async function tex (src) {
  if (!src) return help()
  const msg = await convert(src)
  if (/\\\\|\\newline/.test(src) && !/begin|displaylines/.test(src)) {
    const newline = msg[0] && msg[0].type === 'Plain' ? '\n' : ''
    msg.push(message.plain(newline + strings.aligned)[0])
  }
  return msg
}

async function am (src) {
  if (!src) return help()
  // const tex = lineHelper(src, v => amParser.toTex(v))
  if (!/verb/.test(src)) {
    if (/&/.test(src)) {
      src = src.replace(/\n/g, '\n\n')
    } else {
      const align = /\n/.test(src) ? '& ' : ''
      src = align + src.replace(/\n/g, '\n\n& ')
    }
  }
  const tex = amParser.toTex(src)
  const msg = await convert(tex)
  // if (/\\[a-zA-Z]/.test(src)) {
  //   msg.push(message.plain(strings.useTex)[0])
  // }
  return msg
}

module.exports = [
  {
    reg: /^\/text/i,
    method: text,
    recall: 'math',
  },
  {
    reg: /^\/tex/i,
    method: tex,
    recall: 'math',
  },
  {
    reg: /^\/am/i,
    method: am,
    recall: 'math',
  },
  {
    reg: /^\\tex/i,
    method: async () => strings.stupid,
  },
]
