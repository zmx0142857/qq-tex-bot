require('./logs')
const bot = require('./bot')
const cli = require('./cli')

;(async () => {
  bot.init()
  cli()
})()
