let config
try {
  config = require('./config')
} catch (e) {
  console.error('缺少配置文件 config.js, 请按 README.md 提示操作')
  process.exit(1)
}

const { Bot, Message } = require('mirai-js')
const cli = require('./cli')
const tex2png = require('./tex2png')

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
    if (!config.groups[sender.group.id]) return
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

const getGroupId = index => Object.keys(config.groups)[index]
let currentGroup = getGroupId(0)
const commands = [
  [/^\/ls/, () => console.log(config.groups)],
  [/^\/cd/, input => console.log(
      config.groups[currentGroup = getGroupId(input || 0)]
    )
  ],
  [/^/, input => input && bot.sendMessage({
      group: currentGroup,
      message: textMsg(input)
    }).catch(console.error)
  ]
]

function processCli (text) {
  // 寻找第一个匹配的命令, 并执行
  for ([key, method] of commands) {
    if (!key.test(text)) continue
    return method(text.replace(key, '').trim())
  }
}

(async () => {
  await connect()
  //autoreply(tex2png)
  groupAutoreply(tex2png)
  cli(processCli)
})()
