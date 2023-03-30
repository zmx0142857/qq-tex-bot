const message = require('../message')
const config = require('../config')

const commands = []

function loadCommands () {
  console.log('bot is remaking...')
  commands.length = 0
  commands.push(
    {
      reg: /^\/remake$/,
      async method () {
        loadCommands()
        config.loadConfig()
        return message.plain('已重开')
      },
      whiteList: config.auth.admin,
    },
    {
      reg: /^\/block/,
      async method (text) {
        config.auth.blackList = config.auth.blackList || []
        const args = text.split(/\s/)
        const qq = args.find(arg => arg && arg[0] !== '-')
        if (!qq) return '用法: /block [-d] qq号'
        const isUnblock = args.includes('-d')
        let msg
        if (isUnblock) {
          config.auth.blackList = config.auth.blackList.filter(n => n !== parseInt(qq))
          msg = '取消拉黑 ' + qq
        } else {
          config.auth.blackList.push(parseInt(qq))
          msg = '已拉黑 ' + qq
        }
        console.log(msg)
        return msg
      },
      whiteList: config.auth.admin,
    },
  )

  for (const module of (Object.keys(config.plugins) || [])) {
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

function plugin (text, sender, chain, bot) {
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
      recall,
    } = cmd

    if (!reg.test(text)) continue

    // 名单过滤 (按命令)
    if (!checkWhite(whiteList, whiteGroup, sender)) return
    if (!checkBlack(blackList, blackGroup, sender)) return

    if (trim) {
      text = text.replace(reg, '')
      // trim 模式的命令后至少有一空白符，如：/riddle get 是合法命令，/riddleget 则不是
      if (text && !/\s/.test(text[0])) return
      text = text.trim()
    }
    console.log(sender.id, reg, text)

    // 构造响应体
    return {
      recall,
      message: method(text, sender, chain, bot).catch(e => {
        console.error(e)
        return [message.error]
      })
    }
  }
}

loadCommands()
module.exports = plugin
