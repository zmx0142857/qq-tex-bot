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
      message: buildMsg(input)
    }).catch(console.error)
  ]
]

// 处理消息中的 qq 表情. 如, 滑稽的代码是 \178
function buildMsg(input) {
  let match = input.match(/\\(\d+)/)
  const msg = []
  while (match) {
    if (match.index) {
      msg.push({ type: 'Plain', text: input.slice(0, match.index) })
    }
    msg.push({ type: 'Face', faceId: parseInt(match[1]) })
    input = input.slice(match.index + match[0].length)
    match = input.match(/\\(\d+)/)
  }
  if (input) {
    msg.push({ type: 'Plain', text: input })
  }
  return msg
}

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
