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
AM.define.push([/\*\*/g, '^'])

function onError (err) {
  console.error(err)
  if (err.message === 'mathjax_error')
    return Promise.resolve([message.parseError])
}

// 用 image magick 命令行
function magick (promise) {
  return promise
    .then(buf => fs.writeFile('tmp.svg', buf))
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
function phantom (promise) {
  return promise.then(svg2png)
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
  const buf = []
  let isDisplay = false
  src.split('$$').forEach(s1 => {
    let out
    if (isDisplay) {
      buf.push(' \\\\ & ' + s1 + ' \\\\ & ')
    } else {
      let isFormula = false
      s1.split('$').forEach(s2 => {
        if (isFormula) {
          buf.push(s2)
        } else {
          buf.push('\\text{' + s2 + '}')
        }
        isFormula = !isFormula
      })
    }
    isDisplay = !isDisplay
  })
  return buf.join('')
}

const identical = x => x

function lineHelper (src, fn = identical) {
  if (fn === identical) {
    const buf = []
    let depth = 0
    // 去除环境内换行
    for (let i = 0; i < src.length; ++i) {
      let c = src[i]
      if (i >= 5 && src.slice(i-5, i+1) === '\\begin') {
        ++depth
      } else if (i >= 3 && src.slice(i-3, i+1) === '\\end') {
        --depth
      }
      if (depth !== 0 || c !== '\n') buf.push(c)
    }
    src = buf.join('')
  }
  return '\\begin{aligned}'
    + src.split('\n').map(s => '& ' + fn(s)).join(' \\\\ ')
    + '\\end{aligned}'
}

async function text (src) {
  if (!src) return [message.mathHelp]
  src = contextHelper(src)
  src = lineHelper(src)
  return imageEngine(tex2svg(src))
}

async function tex (src) {
  if (!src) return [message.mathHelp]
  return imageEngine(tex2svg(src))
}

async function am (src) {
  if (!src) return [message.mathHelp]
  const tex = lineHelper(src, am2tex)
  const msg = await imageEngine(tex2svg(tex))
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
