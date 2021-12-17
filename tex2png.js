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
const message = require('./message')

// customize asciimath
AM.define.push([/\*\*/g, '^'])

function onError (err) {
  console.error(err)
  if (err.message === 'mathjax_error')
    return Promise.resolve(message.parseError)
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
  //const displaylines = text => '\\displaylines{' + text + '}'
  const displaylines = text => '\\begin{aligned}' + text + '\\end{aligned}'
  const commands = [
    [/^\/tex/i, () => imageEngine(tex2svg(text))],
    [/^\/am/i, () => imageEngine(tex2svg(displaylines(
      text.split('\n').map(s => am2tex(s)).join(' \\\\ ')
    ))).then(msg => {
      if (/\\[a-zA-Z]/.test(text)) {
        msg.push(message.useTex)
      }
      return msg
    })],
    [/^\/help am/i, async () => [message.help] ]
  ]

  // 寻找第一个匹配的命令, 并执行
  for (let i = 0; i < commands.length; ++i) {
    const [key, method] = commands[i]
    if (!key.test(text)) continue
    text = text.replace(key, '').trim()
    if (i < 2 && !text) return // 使用 tex 和 am 不带参数时, 不作响应
    console.log(sender.id, key, text)
    return { isFormula: i < 2, message: method() }
  }
}
