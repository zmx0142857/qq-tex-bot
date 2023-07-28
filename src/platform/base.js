const message = require('../message')
const plugin = require('../plugin')
const config = require('../config')

/**
 * 继承此类需实现 sendMessage, recallMessage 两个方法
 */
class BaseBot {
  constructor (bot) {
    this._bot = bot
    this.picDict = {} // { [messageId]: url }
    this.replyDict = {} // { [messageId]: replyId }
    this.recallDate = {} // { [senderId]: date }
    this.recallQueue = {} // { [recallType]: replyId }
    this.recallTimer = {} // { [recallType]: timerId }

    // 监听消息撤回
    // 一旦消息被撤回, 机器人的回复也相应撤回
    this.onRecall = async ({ messageId, authorId, group }) => {
      const reply = this.replyDict[messageId]
      const target = (group && group.id) || authorId
      if (!reply) return
      console.log(authorId + ' recalled ' + messageId)
      this.recallMessage({
        messageId: reply.id,
        target,
      })
      if (reply.type !== 'math') return

      // timeDelta (两分钟) 内同一个人连续撤回两次, 则触发提示
      const now = Number(new Date())
      const last = this.recallDate[authorId]
      const timeDelta = 2 * 60 * 1000
      if (!isNaN(last) || last === undefined) {
        this.recallDate[authorId] = now
      }
      if (now - last < timeDelta) {
        // 节流, 5 * timeDelta 内只提示一次
        this.recallDate[authorId] = NaN // 表示冷却中
        setTimeout(() => {
          this.recallDate[authorId] = undefined
        }, 5 * timeDelta)

        const key = group && group.id ? 'group' : 'friend'
        this.sendMessage({
          [key]: target,
          message: message.mathHelp
        })
      }
    }

    // 好友回复
    this.onFriendMsg = async ({ messageChain, sender }) => {
      this.savePicUrl(messageChain, sender.id, '')
      const { text } = messageChain[1]
      const res = plugin(text, sender, messageChain, this)
      if (!res) return
      const msg = await res.message
      if (!msg) return
      const { id } = messageChain[0]
      const replyId = await this.sendMessage({
        friend: sender.id,
        // quote: messageChain[0].id,
        message: msg,
      })
      // savePicUrl(msg, replyId)
      if (res.recall) {
        this.saveReply({
          messageId: id,
          replyId,
          recallType: res.recall,
          target: sender.id,
        })
      }
    }

    // 群消息回复
    this.onGroupMsg = async ({ messageChain, sender }) => {
      const groupId = sender.group.id
      if (!config.groups[groupId]) return
      const context = { bot: this, messageChain, sender, groupId }
      const textMsg = messageChain.find(m => m.type === 'Plain')
      const text = (textMsg && textMsg.text) || ''

      this.savePicUrl(context)
      message.trigger(groupId, text, context)
      message.match(groupId, text, context)

      const res = plugin(text, sender, messageChain, this)
      if (!res) return
      const msg = await res.message
      if (!msg) return
      const { id } = messageChain[0]
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
      // savePicUrl(msg, replyId) TODO: 保存自己的图片?  不能用本地路径
      if (res.recall) {
        // temporary hack
        if (res.recall === '1a2b') {
          if (typeof msg !== 'string' || !/^(输入|已猜|恭喜)/.test(msg)) return
          if (typeof msg === 'string' && /^(已猜|恭喜)/.test(msg)) res.recall = '1a2b-end'
        }
        this.saveReply({
          messageId: id,
          replyId,
          recallType: res.recall,
          target: sender.group.id,
        })
      }
    }
  } // constructor

  // 将收到的消息 id 与机器人的回复 id 保存下来, 以备将来撤回
  saveReply ({ messageId, replyId, recallType, target }) {
    if (/^1a2b/.test(recallType)) {
      const key = '1a2b'
      const messageId = this.recallQueue[key]
      if (messageId) {
        this.recallMessage({
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
        bot: this,
        sender,
        messageChain,
        url,
      })
    })
  }
}

module.exports = BaseBot
