const WebSocket = require('ws')
const message = require('../../message')
const config = require('../../config')
const tex = require('../math/index')[1].method
const bot = require('../../bot')

const hides = [
  /Wolfram Language .* Engine for .* x86 (64-bit)/,
  /Copyright \d+-\d+ Wolfram Research, Inc\./,
  /^In\[\d+\]:=/
]

const texForm = /^Out\[\d+\]\/\/TeXForm=/

let ws
let resolve
let timer
const buf = []
const lastTime = {}
const limit = 3000

function onMessage (data) {
  const msg = String(data, 'utf-8')
  if (hides.some(reg => reg.test(msg))) return

  clearTimeout(timer)
  buf.push(msg)
  timer = setTimeout(() => {
    if (resolve) {
      let out = buf.join('\n').trimEnd()
      if (out.length + 3 > limit) {
        out = out.slice(0, limit) + '...'
      }
      console.log(out)
      if (texForm.test(out)) {
        tex(out.replace(texForm, '')).then(resolve)
      } else {
        resolve(message.plain(out))
      }
    }
    buf.length = 0
  }, 16)
}

function initWs () {
  const url = `ws://127.0.0.1:${config.plugins.mma.port || 2333}/`
  ws = new WebSocket(url)
  ws.on('open', () => {
    console.log('ws opened', url)
    ws.on('message', onMessage)
    ws.on('error', console.error)
    ws.on('close', (code, reason) => {
      console.log('ws closed', code, reason)
    })
    ws.on('unexpectedResponse', ({ req, res }) => {
      console.error('ws unexpected response', req, res)
    })
  })
  return new Promise((res, rej) => {
    setTimeout(res, 5000)
  })
}

async function mma (text, sender, chain) {
  const newTime = new Date()
  const diff = newTime - lastTime[sender.id]
  const coolDown = 20
  if (diff < coolDown * 1000) {
    return message.plain(`你先别急 (${coolDown - Math.round(diff / 1000)}s)`)
  }
  lastTime[sender.id] = newTime

  if (!ws) {
    bot.sendMessage({
      group: sender.group.id,
      message: '在启动啦ˉ\\_(ツ)_/ˉ...',
    })
    await initWs()
  }
  return new Promise((res, rej) => {
    resolve = res
    ws.send(text)
  })
}

module.exports = () => ({
  reg: /^\/mma/i,
  method: mma,
  whiteGroup: config.plugins.mma.whiteGroup,
  whiteList: config.plugins.mma.whiteList,
  recall: 'mma',
})
