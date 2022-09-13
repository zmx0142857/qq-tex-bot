const message = require('../../message')
const { loadRank, saveRank } = require('./rank')
const { _1a2bGroup } = require('../../config').auth

const store = {} // { groupId: Game }
const defaultLen = 4
const defaultLimit = 10

/**
 * 新建 Game 对象, 存入 store
 * @param {number} groupId
 * @param {object} options
 */
function newGame (groupId, options = {}) {
  store[groupId] = {
    len: defaultLen, // 数字长度
    limit: defaultLimit, // 允许猜测次数
    guessCount: 0, // 已猜测次数
    answer: newDigits(options.len),
    history: [],
    ...options,
  }
}

/**
 * 生成 len 位不同的数字
 * @param {number} len
 */
function newDigits(len = defaultLen) {
  const digits = Array.from({ length: 10 }, (_, i) => i);
  const answer = []
  for (let i = 0; i < len; ++i) {
    answer.push(digits.splice(Math.floor(Math.random() * digits.length), 1))
  }
  return answer.join('')
}

/**
 * 检查输入有效性: len 位不同的数字
 * @param {object} current
 * @param {string} guess
 */
function isValid(current, guess) {
  if (guess.length !== current.len || guess.match(/\D/)) {
    return false
  }
  // 要求每位数字不同
  let prev = ''
  for (let d of guess.split('').sort()) {
    if (d === prev) return false
    prev = d
  }
  return true
}

/**
 * 判断猜测是否正确，并给出 1A2B
 * @param {object} current
 * @param {string} guess
 */
function judge(current, guess) {
  let a = 0
  for (let i = 0; i < current.len; ++i) {
    if (current.answer[i] === guess[i]) ++a
  }

  let b = 0
  const s = new Set(current.answer)
  guess.split('').forEach(d => {
    if (s.has(d)) ++b
  })
  current.history.push(`${guess} ${a}A${b - a}B`)
  return a === current.len
}

const limitMap = [0, 10, 10, 10, 10, 12, 12, 12, 12, 12, 12]

async function oneATwoB (text, sender, chain) {
  const groupId = sender.group && sender.group.id
  // console.log(sender, chain)
  if (text === '') {
    return message.plain(`根据提示猜数字。A 表示数字与位置均正确，B 表示数字正确但位置错误。
用法：
/1a2b new [长度] [次数] 新的游戏
/1a2b rank [页码] 查看排行
/1a2b <数字> 参与游戏`)
  } else if (/new( \d+)?( \d+)?/.test(text)) {
    let [_, len, limit] = text.split(/\s+/)
    len = Number(len) || defaultLen
    if (!(len >= 1 && len <= 10))
      return message.plain('长度在 1-10 之间')
    limit = limit ? Number(limit) : limitMap[len]
    if (!(limit > 1))
      return message.plain('多给点机会嘛~')
    newGame(groupId, { len, limit })
    return message.plain(`已生成新的 ${store[groupId].len} 位数字`)
  } else if (/^rank( \d+)?/.test(text)) {
    const page = parseInt(text.slice(5)) || 1
    const rank = await loadRank(groupId, page)
    return message.plain(rank)
  } else if (/\d+/.test(text)) {
    const current = store[groupId]
    if (!current) {
      return message.plain('当前未开始游戏，输入 /1a2b new 开始新游戏')
    }
    const guess = text
    console.log('guess', guess)
    if (!isValid(current, guess)) {
      return message.plain(`请输入 ${current.len} 位不同的数字`)
    }

    const isWin = judge(current, guess)
    const isLose = ++current.guessCount >= current.limit
    if (isWin || isLose) delete store[groupId]

    const prompt = isWin ? `恭喜你猜对了！ ${current.guessCount}/${current.limit}`
      : isLose ? `已猜 ${current.limit} 次，游戏结束。\n答案：${current.answer}`
      : `输入 /1a2b <${current.len} 位不同数字> 参与游戏 ${current.guessCount}/${current.limit}`

    // 记录成绩
    if (isWin) {
      saveRank(groupId, sender)
    }

    return message.plain(prompt + '\n' + current.history.join('\n'))
  }
}

module.exports = {
  reg: /^\/1a2b/i,
  method: oneATwoB,
  whiteGroup: _1a2bGroup,
}
