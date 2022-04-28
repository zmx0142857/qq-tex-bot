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

const identical = x => x

function lineHelper (src, fn = identical) {
  return '\\begin{aligned}'
    + src.split('\n').map(s => '& ' + fn(s)).join(' \\\\ ')
    + '\\end{aligned}'
}

module.exports = {
  async text (src) {
    if (!src) return [message.mathHelp]
    src = lineHelper(src)
    return imageEngine(tex2svg(src))
  },
  async tex (src) {
    if (!src) return [message.mathHelp]
    return imageEngine(tex2svg(src))
  },
  async am (src) {
    if (!src) return [message.mathHelp]
    const tex = lineHelper(src, am2tex)
    const msg = await imageEngine(tex2svg(tex))
    if (/\\[a-zA-Z]/.test(src)) {
      msg.push(message.useTex)
    }
    return msg
  },
}
