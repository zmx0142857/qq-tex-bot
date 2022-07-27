const tex2svg = require('./tex2svg')
const AM = require('asciimath-js')
const { am2tex } = AM
const fs = require('pn/fs')
const path = require('path')
const child = require('child_process')
const config = {
  engine: 'phantom',
  name: 'tmp.png',
  ...require('../../config').image
}
const svg2png = config.engine === 'phantom' ? require('svg2png') : null
const message = require('../../message')

// customize asciimath
AM.define.push(...[
  [/\*\*/g, '^'],
  [/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)/g, '^($1)'],
  [/([₀₁₂₃₄₅₆₇₈₉₊₋]+)/g, '_($1)'],
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
  [/（/g, '('],
  [/）/g, ')'],
  [/[＋⁺₊]/g, '+'],
  [/[－⁻₋]/g, '-'],
])

function onError (err) {
  console.error(err)
  if (err.message === 'mathjax_error')
    return Promise.resolve([message.parseError])
}

// 用 image magick 命令行
function magick (svg) {
  return Promise.resolve(() => fs.writeFile('tmp.svg', svg))
    .then(() => new Promise((resolve, reject) => {
      child.exec(`magick tmp.svg ${path.join(config.path, config.name)}`, err => {
        if (err) reject(err)
        else {
          //console.log('formula done')
          resolve([{ type: 'Image', path: config.name }])
        }
      })
    }))
    .catch(onError)
}

// 用 svg2png 和 phantom js
function phantom (svg) {
  return svg2png(svg)
    .then(buf => fs.writeFile(
      path.join(config.path, config.name), buf)
    )
    .then(() => {
      //console.log('formula done')
      return [{ type: 'Image', path: config.name }]
    })
    .catch(console.error)
}

const imageEngine = config.engine === 'magick' ? magick : phantom

function contextHelper (src) {
  let isDisplay = false
  return src.split('$$').map(s1 => {
    isDisplay = !isDisplay
    if (!isDisplay) {
      return '\n' + s1 + '\n'
    } else {
      let isFormula = false
      return s1.split('$').map(s2 => {
        isFormula = !isFormula
        if (!isFormula) {
          return s2
        } else {
          return s2.split('\n').map(
            s => '\\text{' + s + '}'
          ).join('\n')
        }
      }).join('')
    }
  }).join('')
}

const identical = x => x

function lineHelper (src, fn = identical) {
  if (fn === identical) {
    const buf = []
    let depth = 0
    // 只保留最外层换行
    // 将 \\ 转为换行
    for (let i = 0; i < src.length; ++i) {
      let c = src[i]
      if (i >= 5 && src.slice(i-5, i+1) === '\\begin') {
        ++depth
      } else if (i >= 3 && src.slice(i-3, i+1) === '\\end') {
        --depth
      }
      if (depth === 0 && c === '\\' && src[i+1] === '\\') {
        buf.push('\n')
        ++i
      } else if (depth === 0 || c !== '\n') {
        buf.push(c)
      }
    }
    src = buf.join('')
  }
  return '\\begin{aligned}'
    + src.split('\n').map(s => '& ' + fn(s)).join(' \\\\ ')
    + '\\end{aligned}'
}

async function convert (tex) {
  const res = await tex2svg(tex)
  if (res.error) {
    return message.plain(res.error)
  }
  const msg = await imageEngine(res.svg)
  if (res.width > res.height * 20) {
    msg.push(message.tooWide)
  }
  return msg
}

async function text (src) {
  if (!src) return [message.mathHelp]
  src = contextHelper(src)
  src = lineHelper(src)
  return convert(src)
}

async function tex (src) {
  if (!src) return [message.mathHelp]
  return convert(src)
}

async function am (src) {
  if (!src) return [message.mathHelp]
  const tex = lineHelper(src, am2tex)
  const msg = await convert(tex)
  if (/\\[a-zA-Z]/.test(src)) {
    msg.push(message.useTex)
  }
  return msg
}

module.exports = [
  {
    reg: /^\/text/i,
    method: text,
    isFormula: true,
  },
  {
    reg: /^\/tex/i,
    method: tex,
    isFormula: true,
  },
  {
    reg: /^\/am/i,
    method: am,
    isFormula: true,
  },
]
