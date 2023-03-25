const { Bot, Middleware } = require('mirai-js')
const config = require('./config')
const message = require('./message')
const { exeCommands } = require('./plugin')

const bot = new Bot()

// 连接到 mirai-api-http 服务
async function connect () {
  const server = {
    baseUrl: 'http://127.0.0.1:8080',
    ...config.server
  }
  try {
    await bot.open(server)
    console.log(`connected to mirai-api-http at ${server.baseUrl}`)
  } catch (err) {
    console.error('连接失败, 请确认 mirai-api-http 已经启动\n', err)
  }
}

const replyDict = {} // { [messageId]: replyId }
const recallDate = {} // { [senderId]: date }
const recallQueue = {} // { [recallType]: replyId }
const recallTimer = {} // { [recallType]: timerId }

// 将收到的消息 id 与机器人的回复 id 保存下来, 以备将来撤回
function saveReply({ messageId, replyId, recallType, target }) {
  if (/^1a2b/.test(recallType)) {
    const key = '1a2b'
    const messageId = recallQueue[key]
    if (messageId) {
      bot.recall({
        messageId,
        target,
      })
    }
    if (recallType === key) {
      recallQueue[key] = replyId
      clearTimeout(recallTimer[key])
      recallTimer[key] = setTimeout(() => {
        delete recallQueue[key]
      }, 1000 * 60 * 2) // 2 分钟后释放空间
    } else {
      delete recallQueue[key]
    }
  } else {
    replyDict[messageId] = { id: replyId, type: recallType }
    setTimeout(() => {
      delete replyDict[messageId]
    }, 1000 * 60 * 2) // 2 分钟后释放空间
  }
}

// 监听消息撤回
// 一旦消息被撤回, 机器人的回复也相应撤回
function autoRecall () {
  bot.on(['GroupRecallEvent', 'FriendRecallEvent'],
    async res => {
      const { messageId, authorId, group } = res
      const reply = replyDict[messageId]
      const target = (group && group.id) || authorId
      if (!reply) return
      console.log(authorId + ' recalled ' + messageId)
      bot.recall({
        messageId: reply.id,
        target,
      })
      if (reply.type !== 'math') return

      // timeDelta (两分钟) 内同一个人连续撤回两次, 则触发提示
      const now = Number(new Date())
      const last = recallDate[authorId]
      const timeDelta = 2 * 60 * 1000
      if (!isNaN(last) || last === undefined) {
        recallDate[authorId] = now
      }
      if (now - last < timeDelta) {
        // 节流, timeDelta 内只提示一次
        recallDate[authorId] = NaN // 表示冷却中
        setTimeout(() => {
          recallDate[authorId] = undefined
        }, timeDelta)

        const key = group && group.id ? 'group' : 'friend'
        bot.sendMessage({
          [key]: target,
          message: message.mathHelp
        })
      }
    }
  )
}

const picDict = {} // messageId: url

// 保存图片 url
// 但不会保存自己发的图片
function savePicUrl ({ messageChain, sender, groupId }) {
  const id = messageChain[0].id
  messageChain.forEach(m => {
    if (m.type !== 'Image' || !m.url) return
    const url = m.url
    console.log('receive pic:', id, url)
    picDict[id] = url
    setTimeout(() => {
      delete picDict[id]
    }, 1000 * 60 * 60 * 24) // 24 小时后释放空间

    message.trigger(groupId, message.imageSymbol, {
      bot,
      sender,
      messageChain,
      url,
    })
  })
}

// 好友自动回复
function autoreply (command) {
  bot.on('FriendMessage', async ({ messageChain, sender }) => {
    savePicUrl(messageChain, sender.id, '')
    const { text } = messageChain[1]
    console.log(sender.id, text)
    const res = command(text, sender, messageChain)
    if (!res) return
    const msg = await res.message
    if (!msg) return
    const { id } = messageChain[0]
    const replyId = await bot.sendMessage({
      friend: sender.id,
      // quote: messageChain[0].id,
      message: msg,
    })
    // savePicUrl(msg, replyId)
    if (res.recall) {
      saveReply({
        messageId: id,
        replyId,
        recallType: res.recall,
        target: sender.id,
      })
    }
  })
  console.log('autoreply is listening...')
}

// 监听群消息
function groupAutoreply (command) {
  bot.on('GroupMessage', async ({ messageChain, sender }) => {
    const groupId = sender.group.id
    if (!config.groups[groupId]) return
    const context = { bot, messageChain, sender, groupId }
    const textMsg = messageChain.find(m => m.type === 'Plain')
    const text = (textMsg && textMsg.text) || ''

    savePicUrl(context)
    message.trigger(groupId, text, context)
    message.match(groupId, text, context)

    const res = command(text, sender, messageChain)
    if (!res) return
    const msg = await res.message
    if (!msg) return
    const { id } = messageChain[0]
    const replyId = await bot.sendMessage({
      group: sender.group.id,
      // quote: messageChain[0].id,
      message: msg,
    }).catch(err => {
      console.error('msg:', msg, err)
      return bot.sendMessage({
        group: sender.group.id,
        message: [message.error],
      })
    })
    // savePicUrl(msg, replyId) TODO: 保存自己的图片?  不能用本地路径
    if (res.recall) {
      // temporary hack
      if (res.recall === '1a2b') {
        if (typeof msg !== 'string' || !/^(输入|已猜|恭喜)/.test(msg)) return
        if (typeof msg === 'string' && /^(已猜|恭喜)/.test(msg)) res.recall = '1a2b-end'
      }
      saveReply({
        messageId: id,
        replyId,
        recallType: res.recall,
        target: sender.group.id,
      })
    }
  })
  console.log('group autoreply is listening...')
}

// admin 邀请 bot 入群, bot 自动同意
function agreeJoinGroup () {
  bot.on(
    'BotInvitedJoinGroupRequestEvent',
    new Middleware().invitedJoinGroupRequestProcessor().done((res) => {
      console.log(res)
      if (config.auth.admin.includes(res.fromId)) {
        console.log('已同意加入', res.groupId, res.groupName)
        res.agree()
      }
    })
  )
}

async function initBot () {
  await connect()
  if (config.replyFriend) autoreply(exeCommands) // 好友自动回复
  groupAutoreply(exeCommands)
  agreeJoinGroup()
  autoRecall()
}

module.exports = {
  bot,
  initBot,
  picDict,
}
