const BaseBot = require('./base')
const config = require('../config')
const { getSender, getMessageChain, fromMessageChain } = require('./gocq-adapter')
const initWs = require('./gocq-ws')

class GocqBot extends BaseBot {
  constructor () {
    super(null)

    this.sendMessageQueue = []
    this.onMessage = (data) => {
      // 忽略 heartbeat
      if (data.meta_event_type === 'heartbeat') return

      // 群消息回复
      if (data.message_type === 'group') this.processGroupMsg(data)

      // 发送消息的响应
      if (Object.prototype.hasOwnProperty.call(data, 'retcode')) {
        const callback = this.sendMessageQueue.shift()
        if (data.retcode === 0) {
          callback?.(data.data.message_id)
        } else {
          console.error(data)
          callback?.()
        }
      }
      // TODO: 其它消息类型
    }
  }

  // 群消息预处理
  processGroupMsg (data) {
    const groupId = data.group_id
    if (!config.groups[groupId]) return
    const sender = getSender(data)
    const messageChain = getMessageChain(data)
    this.onGroupMsg({ messageChain, sender })
  }

  // 连接服务
  async init () {
    if (!config.gocq) {
      return console.error('未找到 gocq 配置, 请参考 README.md 进行配置')
    }
    const url = config.gocq.ws
    this.ws = await initWs({
      url,
      onMessage: this.onMessage
    })
  }

  // 发送消息 (目前仅支持群聊)
  // TODO: other action types:
  // send_private_msg, upload_private_file, upload_group_file, get_msg, delete_msg
  async sendMessage ({ friend, group, message }) {
    message = fromMessageChain(message)
    console.log('send', message)
    let params
    if (friend) {
      params = {
        action: 'send_private_msg',
        params: { user_id: friend, message }
      }
    } else if (group) {
      params = {
        action: 'send_group_msg',
        params: { group_id: group, message }
      }
    } else {
      return console.error('missing argument friend or group', friend, group)
    }
    this.ws.send(JSON.stringify(params))
    const messageId = await new Promise((resolve, reject) => {
      this.sendMessageQueue.push(resolve)
    })
    return messageId
  }
}

module.exports = GocqBot
