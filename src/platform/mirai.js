const BaseBot = require('./base')
const { Bot, Middleware } = require('mirai-js')
const config = require('../config')

class MiraiBot extends BaseBot {
  constructor () {
    super(new Bot())
    this.onAgreeJoinGroup = () => {
      new Middleware().invitedJoinGroupRequestProcessor().done((res) => {
        console.log(res)
        if (config.auth.admin.includes(res.fromId)) {
          console.log('已同意加入', res.groupId, res.groupName)
          res.agree()
        }
      })
    }
  }

  async init () {
    // 连接服务
    await this.connect()
    // 好友回复
    if (config.replyFriend) {
      this._bot.on('FriendMessage', this.onFriendMsg)
      console.log('listening to friend message...')
    }
    // 群消息回复
    this._bot.on('GroupMessage', this.onGroupMsg)
    console.log('listening to group message...')
    // 自动同意加群
    this._bot.on('BotInvitedJoinGroupRequestEvent', this.onAgreeJoinGroup)
    // 自动撤回
    this._bot.on(['GroupRecallEvent', 'FriendRecallEvent'], this.onRecall)
  }

  // 连接到 mirai-api-http 服务
  async connect() {
    const server = {
      baseUrl: 'http://127.0.0.1:8080',
      ...config.server
    }
    try {
      await this._bot.open(server)
      console.log(`connected to mirai-api-http at ${server.baseUrl}`)
    } catch (err) {
      console.error('连接失败, 请确认 mirai-api-http 已经启动\n', err)
    }
  }

  sendMessage (params) {
    return this._bot.sendMessage(params)
  }

  recallMessage (params) {
    return this._bot.recall(params)
  }
}

module.exports = MiraiBot
