const message = require('../../message')
const { writeJson } = require('../../utils')
const { loadRank, saveRank, loadScore, saveScore, clearScore } = require('./rank')
const { riddleGroup } = require('../../config').auth
const getRiddle = require('./source')

const store = {} // { groupId: { question, answer } }

async function newRiddle (groupId) {
  const res = await getRiddle(groupId) // 谜面 谜目 谜底
  if (res.code !== 0) return message.plain(res.message)
  const { question, answer } = res
  const bingo = ({ bot, sender, messageChain }) => {
    const groupId = sender.group && sender.group.id
    bot.sendMessage({
      group: groupId,
      quote: messageChain[0].id,
      message: '中'
    })
    message.removeListener(groupId, answer, bingo)
    saveRank(groupId, sender)
    saveScore(groupId, sender)
  }
  message.addListener(groupId, answer, bingo)

  // 1 分钟内无法开底
  store[groupId] = { question, answer: null }
  setTimeout(() => {
    store[groupId] = { question, answer }
  }, 60 * 1000)

  // 1 小时内无回答则取消本题
  setTimeout(() => {
    delete store[groupId]
    message.removeListener(answer, bingo)
  }, 3600 * 1000)

  return message.plain(question)
}

async function riddle (text, sender, chain) {
  const groupId = sender.group && sender.group.id
  if (text === '') {
    return message.plain(`猜灯谜。用法：
/riddle get 查看谜面
/riddle rank [页码] 查看总排行
/riddle begin 开始计分
/riddle score [页码] 查看计分
/riddle open 揭晓谜底
注：谜底为多个组合时用空格隔开，如：中秋 端午`)
  } else if (text === 'get') {
    const group = store[groupId]
    if (group) return message.plain(group.question)
    return newRiddle(groupId);
  } else if (/^rank( \d+)?/.test(text)) {
    const page = parseInt(text.slice(5)) || 1
    const rank = await loadRank(groupId, page)
    return message.plain(rank)
  } else if (text === 'begin') {
    clearScore(groupId)
    return message.plain('游戏已就绪，发送 /riddle get 查看谜面')
  } else if (/^score( \d+)?/.test(text)) {
    const page = parseInt(text.slice(6)) || 1
    const score = await loadScore(groupId, page)
    return message.plain(score)
  } else if (text === 'open') {
    const group = store[groupId]
    if (!group) return message.plain('当前没有谜题。发送 /riddle get 查看谜面')
    const answer = group.answer
    if (!answer) return message.plain('你先别急')
    delete store[groupId]
    return message.plain('谜底：' + answer)
  }
}

module.exports = {
  reg: /^\/riddle/i,
  method: riddle,
  whiteGroup: riddleGroup,
}
