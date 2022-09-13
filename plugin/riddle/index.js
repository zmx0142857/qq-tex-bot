const message = require('../../message')
const { writeJson } = require('../../utils')
const { loadRank, saveRank, loadScore, saveScore, clearScore } = require('./rank')
const { riddleGroup } = require('../../config').auth
const getRiddle = require('./source')

async function newRiddle () {
  const res = await getRiddle() // 谜面 谜目 谜底
  if (res.code !== 0) return message.plain(res.message)
  const bingo = ({ bot, sender, messageChain }) => {
    const groupId = sender.group && sender.group.id
    bot.sendMessage({
        group: groupId,
        quote: messageChain[0].id,
        message: '中'
    })
    message.removeListener(res.answer, bingo)
    saveRank(groupId, sender)
    saveScore(groupId, sender)
  }
  message.addListener(res.answer, bingo)
  return message.plain(res.question)
}

async function riddle (text, sender, chain) {
  const groupId = sender.group && sender.group.id
  if (text === '') {
    return message.plain(`猜灯谜。用法：
/riddle new 新的灯谜
/riddle rank [页码] 查看总排行
/riddle begin 开始计分
/riddle score [页码] 查看计分`)
  } else if (text === 'new') {
    return newRiddle(groupId);
  } else if (/^rank( \d+)?/.test(text)) {
    const page = parseInt(text.slice(5)) || 1
    const rank = await loadRank(groupId, page)
    return message.plain(rank)
  } else if (text === 'begin') {
    clearScore(groupId)
    return message.plain('游戏已就绪，发送 /riddle new 查看谜面')
  } else if (/^score( \d+)?/.test(text)) {
    const page = parseInt(text.slice(6)) || 1
    const score = await loadScore(groupId, page)
    return message.plain(score)
  }
}

module.exports = {
  reg: /^\/riddle/i,
  method: riddle,
  whiteGroup: riddleGroup,
}