const config = require('../../config')
const { loadRank, saveRank } = require('../1a2b/rank')
const fs = require('fs')

const pluginName = 'wordle'
const keyword = '/wdl'
const defaultLen = 5 // TODO: 支持更多长度的单词
const maxGuess = 6
const store = {} // { groupId: Game }
let dict = [] // string[]

async function newGame () {
  if (!dict.length) {
    const words = await fs.promises.readFile('data/wordle.txt', 'utf-8')
    dict = words.split('\n').filter(Boolean)
  }
  const game = {
    len: defaultLen,
    maxGuess,
    timer: setTimeout(() => { game.timer = null }, 5000),
    word: dict[Math.random() * dict.length | 0],
    output: [],
  }
  return game
}

// 假定 word.len === guess.len
// compare('greek', 'leech') => '🟫🟨🟩🟫🟫'
// compare('crane', 'leech') => '🟫🟨🟫🟨🟫'
// compare('crane', 'cream') => '🟩🟩🟨🟨🟫'
const token = {
  GREEN: '🟩',
  YELLOW: '🟨',
  BROWN: '🟫',
}

function compare (word, guess) {
  word = word.split('')
  const buf = Array.from({ length: word.length })
  const visited = Array.from({ length: word.length })
  for (let i = 0; i < guess.length; ++i) {
    if (guess[i] === word[i]) {
      buf[i] = token.GREEN
      visited[i] = true
    }
  }
  for (let i = 0; i < guess.length; ++i) {
    if (!buf[i]) {
      const index = word.findIndex((c, j) => c === guess[i] && !visited[j])
      if (index > -1) {
        visited[index] = true
        buf[i] = token.YELLOW
      } else {
        buf[i] = token.BROWN
      }
    }
  }
  return buf
}

function help () {
  return `用法:
${keyword} new 新的游戏
${keyword} rank [页码] 查看排行
${keyword} <单词> 参与游戏`
}

async function wordle (text, sender) {
  const groupId = sender.group && sender.group.id
  if (/new( \d+)?$/.test(text)) {
    const current = store[groupId]
    if (current && current.timer) return
    const game = await newGame()
    store[groupId] = game
    return `新单词已生成 (${game.len} 个字母)`
  } else if (/^rank( \d+)?$/.test(text)) {
    const page = parseInt(text.slice(5)) || 1
    return loadRank(groupId, page, pluginName)
  } else if (/[a-z]+/.test(text)) {
    const current = store[groupId]
    if (!current) return `游戏尚未开始。输入 ${keyword} new 开始游戏`
    const { len, word, output, maxGuess } = current
    if (text.length === len) {
      if (!dict.some(dictWord => dictWord === text)) return '请输入一个单词'
      const buf = compare(word, text)
      output.push(buf.join('') + ' ' + text)
      if (buf.every(c => c === token.GREEN)) {
        saveRank(groupId, sender, pluginName)
        return `Wordle ${output.length}/${maxGuess}\n` + output.join('\n')
      } if (output.length === maxGuess) {
        delete store[groupId]
        return `已达 ${maxGuess} 次，游戏结束\n答案: ${word}\n` + output.join('\n')
      } else {
        return `输入 ${keyword} <${len} 个字母的单词> 参与游戏\n` + output.join('\n')
      }
    } else {
      return `请输入 ${len} 个字母的单词`
    }
  } else {
    return help()
  }
}

module.exports = () => ({
  reg: /^\/wdl/i,
  method: wordle,
  whiteGroup: config.plugins.wordle.whiteGroup,
  // recall: pluginName,
})
