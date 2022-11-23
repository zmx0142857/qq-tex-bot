const message = require('../../message')
const { loadRank, saveRank, loadScore, saveScore, clearScore } = require('./rank')
const { riddleGroup } = require('../../config').auth
const { getRiddle, resetRiddle, putBackRiddle } = require('./source')

const store = {} // { groupId: { question, answer, raw, timer1, timer2 } }
const helpDict = {
  '露春': '谜面不露春，是指谜面上不会出现谜底的任何一个字。谜目则无此限制，可以出现谜底中的字',
  '探骊格': '探骊格如同深海探宝，不指定谜目，要求将谜目谜底一起猜出，谜目谜底连起来与谜面相扣',
  '卷帘格': '卷帘格，意为『倒卷珠帘』，要把谜底倒过来读，如谜底是『孙行者』，则要读作『者行孙』',
  '离合字': '离合字是将一个字拆成多个部件，如：好女子、弓长张',
  '空格': '谜底为多个组合时用空格隔开，如：中秋 端午',
  '梨花格': '梨花格是谐音格，可以放心使用谐音梗',
  '徐妃格': '取『只得徐妃半面妆』之意，去掉谜底相同的偏旁',
  '摘匾格': '类似徐妃格，去掉谜底相同的部首',
  '白头格': '首字谐音',
  '折巾格': '将谜底第一字左右拆开成两个字，只取其半边字连下文来读',
}
let skipIsBusy

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
  }, 2 * 3600 * 1000)

  store[groupId] = { question, answer, hint, timer1, timer2, bingo }
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
  } else if (text === 'begin') {
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
    // 3s 冷却
    if (skipIsBusy) return
    skipIsBusy = true
    setTimeout(() => { skipIsBusy = false }, 3000)

    invalidateRiddle(groupId)
    return newRiddle(groupId)
  } else {
    const help = helpDict[text]
    if (help) return message.plain(help)
    return message.plain(`猜灯谜。用法：
/riddle get 查看谜面
/riddle begin 开始计分
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
