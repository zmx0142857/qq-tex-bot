const { Bot, Message } = require('mirai-js')
const config = require('./config')

const bot = new Bot()

const reply = {} // { messageId: replyId }

// 将收到的消息 id 与机器人的回复 id 保存下来, 以备将来撤回
function saveReply(messageId, replyId) {
  reply[messageId] = replyId
  setTimeout(() => {
    delete reply[messageId]
  }, 1000 * 60 * 2) // 2 分钟后释放空间
}

// 连接到 mirai-api-http 服务
async function connect () {
  const server = {
    baseUrl: 'http://localhost:8080',
    ...config.server
  }
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
      const { id } = messageChain[0]
      bot.sendMessage({
        friend: sender.id,
        //quote: messageChain[0].id,
        message
      }).then(replyId => {
        saveReply(id, replyId)
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
      const { id } = messageChain[0]
      bot.sendMessage({
        group: sender.group.id,
        //quote: messageChain[0].id,
        message
      }).then(replyId => {
        saveReply(id, replyId)
      }).catch(console.error)
    }
  })
  console.log('group autoreply is listening...')
}

// 监听消息撤回
// 一旦消息被撤回, 机器人的回复也相应撤回
function autoRecall (process) {
  bot.on(['GroupRecallEvent', 'FriendRecallEvent'],
    async ({ messageId }) => {
      console.log(messageId + ' recalled')
      const id = reply[messageId]
      if (id) {
        bot.recall({ messageId: id })
      }
    }
  )
}

module.exports = {
  bot,
  connect,
  autoreply,
  groupAutoreply,
  autoRecall
}
