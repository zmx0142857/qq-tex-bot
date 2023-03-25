const BotSDK = require('go-cqhttp-jsbot').CQBotSDK
const config = require('./config')
const message = require('./message')
const { exeCommands } = require('./plugin')

// Pack {
//   fromUser: 000,
//   fromGroup: 111,
//   rawMessage: '会了',
//   robot: 222,
//   isAt: false,
//   QQInfo: { card: '空一好', nickname: 'I could fran' },
//   success: true,
//   type: 'group'
// }
function getSender (pack) {
  return {
    id: pack.fromUser,
    group: pack.type === 'group' ? { id: pack.fromGroup } : null,
    memberName: pack.QQInfo.card,
    name: pack.QQInfo.nickname,
  }
}

const CQTypes = {
  image: (obj) => ({
    type: 'Image',
    url: obj.url,
  }),
  at: (obj) => ({
    ...obj,
    type: 'At',
  }),
  reply: (obj) => ({
    ...obj,
    type: 'Quote',
  }),
  face: (obj) => ({
    type: 'Face',
    faceId: obj.id,
  }),
}

// get message chain from CQ string
function getMessageChain (rawMessage) {
  const placeholders = []
  const res = rawMessage.replace(/\[CQ:([^,]*),([^\]]*)\]/g, (match, $1, $2) => {
    console.log(match, $1, $2)
    const obj = Object.fromEntries($2.split(',').map(entry => entry.split('=')))
    placeholders.push(CQTypes[$1] ? CQTypes[$1](obj) : { ...obj, type: $1 })
    return '[CQ:placeholder]'
  })
  const chain = []
  res.split('[CQ:placeholder]').forEach((text, index) => {
    if (text) chain.push({ type: 'Plain', text })
    const placeholder = placeholders[index]
    if (placeholder) chain.push(placeholder)
  })
  return chain
}

class Bot {
  constructor () {
    this._bot = null
    this.picDict = {}
    this.replyDict = {} // { [messageId]: replyId }
    this.recallDate = {} // { [senderId]: date }
    this.recallQueue = {} // { [recallType]: replyId }
    this.recallTimer = {} // { [recallType]: timerId }
  }

  init () {
    this.connect()
    setTimeout(() => {
      this.groupAutoreply()
      this.listenToEvents()
    }, 1000)
  }

  connect () {
    if (!config.gocq) {
      return console.error('未找到 gocq 配置, 请参考 README.md 进行配置')
    }
    const gocq = Object.assign({
      host: '0.0.0.0',
      port: 5700, // 正向端口
      reversePort: 5701, // 反向上报端口
    }, config.gocq)
    this._bot = new BotSDK(gocq.host, gocq.reversePort).createBot(gocq.qq, gocq.port)
  }

  sendMessage ({ group, message }) {
    console.log('send', message)
    // TODO, build message from message chain
    const text = typeof message === 'string' ? message : Array.isArray(message) && message.find(msg => msg.type === 'Plain').text
    if (text) {
      return this._bot.sendGroupMsg(group, text)
    }
  }

  // 保存图片 url
  // 但不会保存自己发的图片
  savePicUrl ({ messageChain, sender, groupId }) {
    const id = messageChain[0].id
    messageChain.forEach(m => {
      if (m.type !== 'Image' || !m.url) return
      const url = m.url
      console.log('receive pic:', id, url)
      this.picDict[id] = url
      setTimeout(() => {
        delete this.picDict[id]
      }, 1000 * 60 * 60 * 24) // 24 小时后释放空间

      message.trigger(groupId, message.imageSymbol, {
        bot,
        sender,
        messageChain,
        url,
      })
    })
  }

  // 将收到的消息 id 与机器人的回复 id 保存下来, 以备将来撤回
  saveReply({ messageId, replyId, recallType, target }) {
    if (/^1a2b/.test(recallType)) {
      const key = '1a2b'
      const messageId = this.recallQueue[key]
      if (messageId) {
        bot.recall({
          messageId,
          target,
        })
      }
      if (recallType === key) {
        this.recallQueue[key] = replyId
        clearTimeout(this.recallTimer[key])
        this.recallTimer[key] = setTimeout(() => {
          delete this.recallQueue[key]
        }, 1000 * 60 * 2) // 2 分钟后释放空间
      } else {
        delete this.recallQueue[key]
      }
    } else {
      this.replyDict[messageId] = { id: replyId, type: recallType }
      setTimeout(() => {
        delete this.replyDict[messageId]
      }, 1000 * 60 * 2) // 2 分钟后释放空间
    }
  }

  groupAutoreply () {
    this._bot.onGroupMsg(async (pack) => {
      const groupId = pack.fromGroup
      // if (!config.groups[groupId]) return
      const sender = getSender(pack)
      const messageChain = getMessageChain(pack.rawMessage)
      console.log('pack', pack)
      // console.log('sender', sender)
      // console.log('chain', messageChain)
      const context = { bot: this, messageChain, sender, groupId }
      const textMsg = messageChain.find(m => m.type === 'Plain')
      const text = (textMsg && textMsg.text) || ''

      // savePicUrl(context)
      message.trigger(groupId, text, context)
      message.match(groupId, text, context)

      const res = exeCommands(text, sender, messageChain)
      if (!res) return
      const msg = await res.message
      if (!msg) return
      // const { id } = messageChain[0]// TODO: there is no id
      const replyId = await this.sendMessage({
        group: sender.group.id,
        // quote: messageChain[0].id,
        message: msg,
      }).catch(err => {
        console.error('msg:', msg, err)
        return this.sendMessage({
          group: sender.group.id,
          message: [message.error],
        })
      })
      console.log('replyId', replyId)
      // savePicUrl(msg, replyId) TODO: 保存自己的图片?  不能用本地路径
      if (res.recall) {
        // temporary hack
        if (res.recall === '1a2b') {
          if (typeof msg !== 'string' || !/^(输入|已猜|恭喜)/.test(msg)) return
          if (typeof msg === 'string' && /^(已猜|恭喜)/.test(msg)) res.recall = '1a2b-end'
        }
        // this.saveReply({
        //   messageId: id,
        //   replyId,
        //   recallType: res.recall,
        //   target: sender.group.id,
        // })
      }
    })
    console.log('group autoreply is listening...')
  }

  listenToEvents () {
    this._bot.onEventMsg(pack => {
      console.log('event', pack)
    })
    console.log('events is listening...')
  }
}

const bot = new Bot()
module.exports = bot
