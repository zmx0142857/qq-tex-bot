const message = require('../message')
const config = require('../config')

const commands = [
  {
    reg: /^\/remake$/,
    async method () {
      loadCommands()
      return message.plain('已重开')
    },
    whiteList: config.auth.admin,
  },
  {
    reg: /^\/block$/,
    async method (text) {
      config.auth.blackList = config.auth.blackList || []
      config.auth.blackList.push(parseInt(text))
      const msg = '已拉黑 ' + text
      console.log(msg)
      return message.plain(msg)
    },
    whiteList: config.auth.admin,
  },
]
const initLen = commands.length

function loadCommands () {
  console.log('bot is remaking...')
  commands.length = initLen
  for (const module of (config.plugins || [])) {
    try {
      let cmd = require('./' + module)
      if (typeof cmd === 'function') cmd = cmd()
      if (Array.isArray(cmd)) {
        commands.push(...cmd)
      } else {
        commands.push(cmd)
      }
    } catch (e) {
      console.error('[err] module not found:', module)
      console.error(e)
    }
  }
}

function checkWhite(list, group, sender) {
  if (!list && !group) return true
  if (list && list.includes(sender.id)) return true
  if (group && sender.group && group.includes(sender.group.id)) return true
  return false
}

function checkBlack(list, group, sender) {
  if (!list && !group) return true
  if (list && list.includes(sender.id)) return false
  if (group && sender.group && group.includes(sender.group.id)) return false
  return true
}

function exeCommands (text, sender, chain) {
  const { whiteList, whiteGroup, blackList, blackGroup } = config.auth
  // 名单过滤
  if (!config.auth.admin || !config.auth.admin.includes(sender.id)) {
    if (!checkWhite(whiteList, whiteGroup, sender)) return
    if (!checkBlack(blackList, blackGroup, sender)) return
  }

  // 寻找第一个匹配的命令, 并执行
  for (const cmd of commands) {
    const {
      reg,
      method,
      whiteList,
      whiteGroup,
      blackList,
      blackGroup,
      trim = true,
      isFormula,
    } = cmd

    if (!reg.test(text)) continue

    // 名单过滤 (按命令)
    if (!checkWhite(whiteList, whiteGroup, sender)) return
    if (!checkBlack(blackList, blackGroup, sender)) return

    if (trim) {
      text = text.replace(reg, '').trim()
    }
    console.log(sender.id, reg, text)

    // 构造响应体
    return {
      isFormula,
      message: method(text, sender, chain).catch(e => {
        console.error(e);
        return [message.error]
      })
    }
  }
}

loadCommands()
module.exports = {
  exeCommands,
}
