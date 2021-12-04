const tex2svg = require('./tex2svg')
const AM = require('./asciimath')
const { am2tex } = AM
const fs = require('pn/fs')
const path = require('path')
const child = require('child_process')
const config = {
  engine: 'phantom',
  name: 'tmp.png',
  ...require('./config').image
}
const svg2png = config.engine === 'phantom' ? require('svg2png') : null

// customize asciimath
AM.define.push([/\*\*/g, '^'])

function onError (err) {
  console.error(err)
  if (err.message === 'mathjax_error')
    return Promise.resolve({ type: 'Plain', text: ' [error] 无法识别此公式, 格式有误?' })
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

module.exports = function tex2png (text, sender) {
  const displaylines = text => '\\displaylines{' + text + '}'
  const commands = [
    [/^\/tex/i, () => imageEngine(tex2svg(text))],
    [/^\/am/i, () => imageEngine(tex2svg(displaylines(
      text.split('\n').map(s => am2tex(s)).join(' \\\\ ')
    ))).then(msg => {
      if (/\\[a-zA-Z]/.test(text)) {
        msg.push({ type: 'Plain', text: '您是不是想要使用 /tex 而不是 /am ?' })
      }
      return msg
    })],
    [/^\/help am/i, () => {
      console.log('help activated')
      return [{
        type: 'Plain',
        text: '需要帮助吗？在这里喔 https://zmx0142857.gitee.io/note'
      }]
    ]
  ]

  // 寻找第一个匹配的命令, 并执行
  for ([key, method] of commands) {
    if (!key.test(text)) continue
    text = text.replace(key, '').trim()
    if (!text) return
    console.log(sender.id, key, text)
    return method()
  }
}
