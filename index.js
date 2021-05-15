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
  //autoreply,
  groupAutoreply
} = require('./bot')
const cli = require('./cli')
const tex2png = require('./tex2png')

;(async () => {
  await connect()
  //autoreply(tex2png)
  groupAutoreply(tex2png)
  cli()
})()
