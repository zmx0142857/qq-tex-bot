const message = require('../message')
const { am, tex } = require('./math')
const rotateImage = require('./rotate')

module.exports = function command (text, sender, chain) {
  const commands = [
    [/^\/tex/i, tex],
    [/^\/am/i, am],
    [/^\/help am/i, async () => [message.help] ],
    [/^\/rotate/i, rotateImage],
  ]

  // 寻找第一个匹配的命令, 并执行
  for (let i = 0; i < commands.length; ++i) {
    const isFormula = i < 2
    const [reg, method] = commands[i]
    if (!reg.test(text)) continue
    text = text.replace(reg, '').trim()
    if (isFormula && !text) return // 使用 tex 和 am 不带参数时, 不作响应
    console.log(sender.id, reg, text)
    return {
      isFormula,
      message: method(text, sender, chain)
    }
  }
}