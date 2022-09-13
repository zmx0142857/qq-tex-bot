const message = require('../../message')
const { writeJson } = require('../../utils')
const { loadRank, saveRank, loadScore, saveScore, clearScore } = require('./rank')
const { riddleGroup } = require('../../config').auth

const store = {} // { groupId: answer }

function newRiddle () {
  const riddle = '布什军队男兵多【日本动漫】'
  return message.plain(riddle)
}

function riddle (text, sender, chain) {
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