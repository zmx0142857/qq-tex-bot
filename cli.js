const readline = require('readline')
const { bot } = require('./bot')
const config = require('./config')

const cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

cli.on('close', () => {
  console.log('\ncli closed. ctrl-c again to exit') // 正确换行
})

const getGroupId = index => Object.keys(config.groups)[index]
let currentGroup = getGroupId(0)
const commands = [
  [/^\/ls/, () => console.log(config.groups)],
  [/^\/cd/, input => console.log(
      config.groups[currentGroup = getGroupId(input || 0)]
    )
  ],
  [/^/, input => input && bot.sendMessage({
      group: currentGroup,
      message: [{ type: 'Plain', text: input }]
    }).catch(console.error)
  ]
]

function processCli (text) {
  // 寻找第一个匹配的命令, 并执行
  for ([key, method] of commands) {
    if (!key.test(text)) continue
    return method(text.replace(key, '').trim())
  }
}

module.exports = function interact () {
  cli.question('> ', input => {
    processCli(input)
    interact()
  })
}
