const { Bot, Message } = require('mirai-js')
const config = require('./config')
const message = require('./message')
const { savePicComplete } = require('./plugin/savepic/index')

const bot = new Bot()

// 连接到 mirai-api-http 服务
async function connect () {
  const server = {
    baseUrl: 'http://localhost:8080',
    ...config.server
  }
  await bot.open(server)
  console.log(`connected to mirai-api-http at ${server.baseUrl}`)
}

const replyDict = {} // { [messageId]: replyId }
const recallDate = {} // { [senderId]: date }

// 将收到的消息 id 与机器人的回复 id 保存下来, 以备将来撤回
function saveReply(messageId, replyId, senderId) {
  replyDict[messageId] = replyId
  setTimeout(() => {
    delete replyDict[messageId]
  }, 1000 * 60 * 2) // 2 分钟后释放空间
}

// 监听消息撤回
// 一旦消息被撤回, 机器人的回复也相应撤回
function autoRecall () {
  bot.on(['GroupRecallEvent', 'FriendRecallEvent'],
    async res => {
      const { messageId, authorId, group } = res
      const id = replyDict[messageId]
      if (!id) return
      console.log(authorId + ' recalled ' + messageId)
      bot.recall({ messageId: id })

      // timeDelta (两分钟) 内同一个人连续撤回两次, 则触发提示
      const now = Number(new Date())
      const last = recallDate[authorId]
      const timeDelta = 2 * 60 * 1000
      if (last === last) recallDate[authorId] = now
      if (now - last < timeDelta) {
        // 节流, timeDelta 内只提示一次
        recallDate[authorId] = NaN // 表示冷却中
        setTimeout(() => {
          recallDate[authorId] = undefined
        }, timeDelta)

        if (group && group.id) {
          bot.sendMessage({
            group: group.id,
            message: [message.mathHelp]
          })
        } else {
          bot.sendMessage({
            friend: authorId,
            message: [message.mathHelp]
          })
        }
      }
    }
  )
}

const picDict = {} // messageId: url

// 保存图片 url
// 但不会保存自己发的图片
function savePicUrl (chain, senderId, groupId) {
  const id = chain[0].id
  chain.forEach(m => {
    if (m.type === 'Image' && m.url) {
      console.log('savePic:', id, m.url)
      picDict[id] = m.url
      setTimeout(() => {
        delete picDict[id]
      }, 1000 * 60 * 60 * 24) // 24 小时后释放空间

      // 完成 savepic
      savePicComplete(groupId, senderId, m.url)
    }
  })
}

// 好友自动回复
function autoreply (command) {
  bot.on('FriendMessage', async ({ messageChain, sender }) => {
    savePicUrl(messageChain, senderId, '')
    const { text } = messageChain[1]
    console.log(sender.id, text)
    const res = command(text, sender, messageChain)
    if (!res) return
    const message = await res.message
    if (message) {
      const { id } = messageChain[0]
      bot.sendMessage({
        friend: sender.id,
        //quote: messageChain[0].id,
        message
      }).then(replyId => {
        // savePicUrl(message, replyId)
        if (res.isFormula) saveReply(id, replyId, sender.id)
      }).catch(console.error)
    }
  })
  console.log('autoreply is listening...')
}

// 监听群消息
function groupAutoreply (command) {
  bot.on('GroupMessage', async ({ messageChain, sender }) => {
    //console.log(sender.group.id)
    if (!config.groups[sender.group.id]) return
    savePicUrl(messageChain, sender.id, sender.group.id)
    const textMsg = messageChain.find(m => m.type === 'Plain')
    const text = (textMsg && textMsg.text) || ''
    const res = command(text, sender, messageChain)
    if (!res) return
    const message = await res.message
    if (message) {
      const { id } = messageChain[0]
      bot.sendMessage({
        group: sender.group.id,
        //quote: messageChain[0].id,
        message
      }).then(replyId => {
        // savePicUrl(message, replyId) TODO: 保存自己的图片?  不能用本地路径
        if (res.isFormula) saveReply(id, replyId, sender.id)
      }).catch(console.error)
    }
  })
  console.log('group autoreply is listening...')
}

module.exports = {
  bot,
  connect,
  autoreply,
  groupAutoreply,
  autoRecall,
  picDict
}
