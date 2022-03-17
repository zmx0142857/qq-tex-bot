const message = require('../message')
const config = require('../config')
const { am, tex } = require('./math')
const rotateImage = require('./rotate')
const oneATwoB = require('./one-a-two-b')

const commands = [
  [/^\/tex/i, tex],
  [/^\/am/i, am],
  // [/^\/rotate/i, rotateImage],
  [/^\/1a2b/i, oneATwoB],
]

module.exports = function command (text, sender, chain) {
  // 寻找第一个匹配的命令, 并执行
  for (let i = 0; i < commands.length; ++i) {
    const [reg, method, whiteList] = commands[i]
    if (!reg.test(text)) continue

    // 白名单过滤
    // 若不存在白名单, 则直接放行
    if (whiteList && sender.group && !whiteList.includes(sender.group.id)) break

    // 黑名单过滤
    if (config.blackList && config.blackList.includes(sender.id)) break

    text = text.replace(reg, '').trim()
    console.log(sender.id, reg, text)

    // 构造响应体
    const isFormula = i < 2
    return {
      isFormula,
      message: method(text, sender, chain).catch(e => {
        console.error(e);
        return [message.error]
      })
    }
  }
}
