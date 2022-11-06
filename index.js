require('./logs')
let config
try {
  config = require('./config')
} catch (e) {
  console.error('缺少配置文件 config.js, 请按 README.md 提示操作')
  process.exit(1)
}

const {
  //bot,
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
