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
  [/^\/help/, () => console.log(`/help 显示帮助
/ls 列出 bot 加入的群
/cd [index] 切换到第 index 个群，index 从 0 开始
/quit [groupId] 退群
发送其它任意消息进行水群
`)],
  // 群号列表
  [/^\/ls/, () => console.log(config.groups)],
  // 切换群
  [/^\/cd/, input => console.log(
      config.groups[currentGroup = getGroupId(input || 0)]
    )
  ],
  // 退群
  [/^\/quit/, async groupId => {
    if (!config.groups.hasOwnProperty(groupId)) return console.log('请输入正确的群号')
    try {
      await bot.quitGroup({ group: groupId })
      console.log('已退出群聊', groupId)
    } catch (e) {
      console.error('退群失败:', groupId, e)
    }
  }],
  // 水群
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
