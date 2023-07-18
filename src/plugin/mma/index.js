const WebSocket = require('ws')
const path = require('path')
const message = require('../../message')
const config = require('../../config')
const tex = require('../math/index')[1].method
const helpDict = require('./help')
const child = require('child_process')

const reg = {
  hides: [
    /Wolfram Language .* Engine for .* x86 (64-bit)/,
    /Copyright \d+-\d+ Wolfram Research, Inc\./,
    /^In\[\d+\]:=/
  ],
  texForm: /^Out\[\d+\]\/\/TeXForm=/,
  plot: /\b(Plot|Rasterize)\b/,
  blackList: /\b(Export|RunProcess)\b/,
}

let ws
let resolve
let timer
const buf = []
const lastTime = {}
const filepath = path.join(config.image.path, config.image.name || 'tmp.png')

async function help (text) {
  return helpDict[text] || '用法: /mma <wolfram language>'
}

function limit (str, len = 3000) {
  if (str.length + 3 > len) {
    str = str.slice(0, len) + '...'
  }
  console.log(str)
  return str
}

function onMessage (data) {
  const msg = String(data, 'utf-8')
  if (reg.hides.some(reg => reg.test(msg))) return

  clearTimeout(timer)
  buf.push(msg)
  timer = setTimeout(() => {
    if (resolve) {
      let out = buf.join('\n').trimEnd()
      if (reg.texForm.test(out)) {
        // 公式图片
        tex(out.replace(reg.texForm, '')).then(resolve)
        limit(out)
      } else if (out.includes(']= ' + filepath)) {
        // mma Export file
        resolve(message.image(filepath))
        limit(out)
      } else {
        resolve(message.plain(limit(out)))
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

function dealRequest (text) {
  if (reg.plot.test(text)) {
    text = `Export["${filepath}", ${text}]`
  } else if (reg.blackList.test(text)) {
    throw new Error('你在干坏事吗？嗯哼！')
  }
  return text
}

async function mma (text, sender, chain, bot) {
  if (!text) {
    return help()
  } else if (text === 'remake') {
    if (!config.auth.admin.includes(sender.id)) return
    ws = null
    buf.length = 0
    return new Promise((resolve, reject) => {
      child.exec('pm2 reload mma', err => {
        if (err) {
          reject(err)
        } else {
          resolve('mma 已重置')
        }
      })
    })
  }
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
      message: '在启动啦喵——',
    })
    await initWs()
  }

  try {
    text = dealRequest(text)
  } catch (err) {
    return err.message
  }

  return new Promise((res, rej) => {
    resolve = res
    ws.send(text)
  })
}

module.exports = () => ([
  {
    reg: /^\/mma\?/i,
    method: help,
    whiteGroup: config.plugins.mma.whiteGroup,
    whiteList: config.plugins.mma.whiteList,
    recall: 'mma',
  },
  {
    reg: /^\/mma/i,
    method: mma,
    whiteGroup: config.plugins.mma.whiteGroup,
    whiteList: config.plugins.mma.whiteList,
    recall: 'mma',
  },
])
