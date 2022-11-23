require('./logs')
const config = require('./config')

const {
  // bot,
  connect,
  autoreply,
  groupAutoreply,
  autoRecall,
  agreeJoinGroup,
} = require('./bot')
const cli = require('./cli')
const { exeCommands } = require('./plugin')

;(async () => {
  await connect()
  if (config.replyFriend) autoreply(exeCommands) // 好友自动回复
  groupAutoreply(exeCommands)
  agreeJoinGroup()
  autoRecall()
  cli()
})()
