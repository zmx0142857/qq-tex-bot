const { Bot, Message } = require('mirai-js')
const tex2svg = require('./tex2svg')
const svg2png = require('svg2png')
const { am2tex } = require('./asciimath')
const fs = require('pn/fs')
const path = require('path')
const child = require('child_process')
const cli = require('./cli')

let config
try {
  config = require('./config')
} catch (e) {
  console.error('缺少配置文件 config.js, 请按 README.md 提示操作')
  process.exit(1)
}

const bot = new Bot()

// 连接到 mirai-api-http 服务
async function connect () {
  const { server } = config
  await bot.open(server)
  console.log(`connected to mirai-api-http at ${server.baseUrl}`)
}

function textMsg (text) {
  return [{ type: 'Plain', text }] // 或者 new Message().addText(text)
}

function imageMsg (url) {
  return [{ type: 'Image', url }] // 或者 new Message().addImageUrl(url)
}

// 好友自动回复
function autoreply (process) {
  bot.on('FriendMessage', async ({ messageChain, sender }) => {
    const { text } = messageChain[1]
    console.log(sender.id, text)
    const message = await process(text)
    if (message) {
      bot.sendMessage({
        friend: sender.id,
        //quote: messageChain[0].id,
        message
      }).catch(console.error)
    }
  })
  console.log('autoreply is listening...')
}

// 监听群消息
function groupAutoreply (process) {
  bot.on('GroupMessage', async ({ messageChain, sender }) => {
    //console.log(sender.group.id)
    if (!config.groups.includes(sender.group.id)) return
    const msg = messageChain[messageChain.length-1]
    if (!msg || msg.type !== 'Plain') return
    const message = await process(msg.text, sender)
    if (message) {
      bot.sendMessage({
        group: sender.group.id,
        //quote: messageChain[0].id,
        message
      }).catch(console.error)
    }
  })
  console.log('group autoreply is listening...')
}

function onError (err) {
  console.error(err)
  if (err.message === '公式格式有误')
    return Promise.resolve(textMsg(' [error] ' + err.message))
}

// 用 image magick 命令行
function magick (promise) {
  //return Promise.resolve(textMsg('test'))
  return promise
    .then(buf => fs.writeFile('tmp.svg', buf))
    .then(() => new Promise((resolve, reject) => {
      child.exec(`magick tmp.svg ${path.join(config.image.path, config.image.name)}`, err => {
        if (err) reject(err)
        else {
          //console.log('formula done')
          resolve([{ type: 'Image', path: config.image.name }])
        }
      })
    }))
    .catch(onError)
}

// 用 svg2png 和 phantom js
// TODO: 图片背景是透明的, 如何改成白色?
function phantom (promise) {
  return promise.then(svg2png)
    .then(buf => fs.writeFile(
      path.join(config.image.path, config.image.name), buf)
    )
    .then(() => {
      //console.log('formula done')
      return [{ type: 'Image', path: config.image.name }]
    })
    .catch(console.error)
}

const imageEngine = config.image.engine === 'magick' ? magick : phantom

function tex2png (text, sender) {
  const commands = new Map([
    [/^\/tex/, () => imageEngine(tex2svg(text))],
    [/^\/am/, () => imageEngine(tex2svg(am2tex(text)))],
  ])

  // 寻找第一个匹配的命令, 并执行
  for ([key, method] of commands) {
    if (!key.test(text)) continue
    text = text.replace(key, '').trim()
    if (!text) return
    console.log(sender.id, key, text)
    return method()
  }
}

function sendMsg (input) {
  input = input.trim()
  if (input) {
    bot.sendMessage({
      group: config.groups[0],
      message: textMsg(input)
    }).catch(console.error)
  }
}

(async () => {
  await connect()
  //autoreply(tex2png)
  groupAutoreply(tex2png)
  cli(sendMsg)
})()
