const fs = require('fs')

const store = {}

async function getRiddle (groupId) {
  let text, lines
  if (store[groupId]) {
    lines = store[groupId]
  } else {
    try {
      text = await fs.promises.readFile('data/riddle.txt', 'utf-8')
    } catch (e) {
      console.error(e)
      return { code: 1, message: '获取谜面失败，请稍后再试' }
    }
    if (!text.trim()) lines = []
    else lines = text.trim().split('\n').sort(() => Math.random() < 0.5 ? -1 : 1)
    store[groupId] = lines
  }
  if (!lines.length) return { code: 2, message: '已经没有更多谜题了！' }
  const randLine = lines.pop()
  try {
    const [face, category, answer, hint] = randLine.split(',')
    return {
      code: 0,
      question: `${face}【${category}】`,
      answer: answer.trim(),
      raw: randLine,
      hint: hint || '没有提示捏',
    }
  } catch (e) {
    console.error(e)
    console.error('randLine:', randLine)
    return { code: 3, message: '谜题解析失败' }
  }
}

function putBackRiddle (groupId, raw) {
  const lines = store[groupId]
  if (lines) {
    lines.push(raw)
  } else {
    console.error('putBack failed: lines is undefined')
  }
}

function resetRiddle (groupId) {
  delete store[groupId]
}

module.exports = {
  getRiddle,
  resetRiddle,
  putBackRiddle,
}
