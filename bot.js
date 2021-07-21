const { Bot, Message } = require('mirai-js')
const config = require('./config')

const bot = new Bot()

// 连接到 mirai-api-http 服务
async function connect () {
  const { server } = config
  await bot.open(server)
  console.log(`connected to mirai-api-http at ${server.baseUrl}`)
}

// 好友自动回复
function autoreply (process) {
  bot.on('FriendMessage', async ({ messageChain, sender }) => {
    const { text } = messageChain[1]
    console.log(sender.id, text)
    const message = await process(text, sender)
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

module.exports = {
  bot,
  connect,
  autoreply,
  groupAutoreply
}
