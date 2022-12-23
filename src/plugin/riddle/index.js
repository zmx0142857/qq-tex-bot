const message = require('../../message')
const { loadRank, saveRank, loadScore, saveScore, clearScore } = require('./rank')
const config = require('../../config')
const adminList = config.auth.admin
const riddleGroup = config.plugins.riddle.whiteGroup
const { getRiddle, resetRiddle, putBackRiddle } = require('./source')
const helpDict = require('./help')
const { bot } = require('../../bot')

const store = {} // { groupId: { question, answer, raw, timer1, timer2, timer3 } }

function invalidateRiddle (groupId) {
  const group = store[groupId]
  if (group) {
    clearTimeout(group.timer1)
    clearTimeout(group.timer2)
    message.removeListener(groupId, group.answer, group.bingo)
  }
  delete store[groupId]
}

async function newRiddle (groupId) {
  const res = await getRiddle(groupId) // 谜面 谜目 谜底
  if (res.code !== 0) return message.plain(res.message)
  const { question, answer, hint } = res
  const bingo = ({ bot, sender, messageChain }) => {
    const groupId = sender.group && sender.group.id
    bot.sendMessage({
      group: groupId,
      quote: messageChain[0].id,
      message: '中'
    })
    invalidateRiddle(groupId)
    saveRank(groupId, sender)
    saveScore(groupId, sender)
  }

  // 1 分钟内无法开底
  const timer1 = setTimeout(() => {
    store[groupId].timer1 = null
  }, 60 * 1000)

  // 2 小时内无回答则取消本题
  const timer2 = setTimeout(() => {
    invalidateRiddle(groupId)
    putBackRiddle(groupId, res.raw)
    bot.sendMessage({
      group: groupId,
      message: '谜题已过期，发送 /riddle get 重新查看'
    })
  }, 2 * 3600 * 1000)

  store[groupId] = { question, answer, hint, timer1, timer2, timer3: null, bingo }
  message.addListener(groupId, answer, bingo)

  return message.plain(question)
}

async function riddle (text, sender, chain) {
  const groupId = sender.group && sender.group.id
  if (text === 'get') {
    const group = store[groupId]
    if (group) return message.plain(group.question)
    return newRiddle(groupId)
  } else if (/^rank( \d+)?/.test(text)) {
    const page = parseInt(text.slice(5)) || 1
    const rank = await loadRank(groupId, page)
    return message.plain(rank)
  } else if (text === 'remake') {
    if (!adminList.includes(sender.id)) return
    clearScore(groupId)
    resetRiddle(groupId)
    return message.plain('游戏已就绪，发送 /riddle get 查看谜面')
  } else if (/^score( \d+)?/.test(text)) {
    const page = parseInt(text.slice(6)) || 1
    const score = await loadScore(groupId, page)
    return message.plain(score)
  } else if (text === 'hint') {
    const group = store[groupId]
    if (!group) return message.plain('当前没有谜题。发送 /riddle get 查看谜面')
    return message.plain('提示：' + group.hint)
  } else if (text === 'open') {
    const group = store[groupId]
    if (!group) return message.plain('当前没有谜题。发送 /riddle get 查看谜面')
    if (group.timer1 !== null) return message.plain('你先别急')
    invalidateRiddle(groupId)
    return message.plain('谜底：' + group.answer)
  } else if (text === 'skip') {
    if (!adminList.includes(sender.id)) return
    const group = store[groupId]
    if (!group) return message.plain('当前没有谜题。发送 /riddle get 查看谜面')
    if (group.timer3 !== null) return
    // 3s 冷却
    group.timer3 = true
    setTimeout(() => { group.timer3 = null }, 3000)

    invalidateRiddle(groupId)
    return newRiddle(groupId)
  } else {
    const help = helpDict[text]
    if (help) return message.plain(help)
    return message.plain(`猜灯谜。用法：
/riddle get 查看谜面
/riddle remake 重新开始游戏
/riddle score [页码] 查看计分
/riddle rank [页码] 查看总排行
/riddle hint 获取提示
/riddle open 揭晓谜底
/riddle skip 跳过谜题
注：无需使用指令/回复/at，直接发送谜底即可参与猜谜。
谜底为多个组合时用空格隔开，如：中秋 端午`)
  }
}

module.exports = {
  reg: /^\/riddle/i,
  method: riddle,
  whiteGroup: riddleGroup,
}
