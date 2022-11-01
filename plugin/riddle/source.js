const fs = require('fs')

const store = {}

async function getRiddle1 (groupId) {
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
    const [face, category, answer] = randLine.split(',')
    return { code: 0, question: `${face}【${category}】`, answer: answer.trim(), raw: randLine }
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

async function getRiddle2 () {
  const html = `<meta property="og:title" content="情侣 （4字称谓）的谜底是什么？">
    <meta property="og:description" content="情侣 （4字称谓）的谜底是【生意 伙伴】。">`

  let question, answer
  const match1 = html.match(/<meta property="og:title" content="([^"]*)">/)
  if (match1) question = match1[1]
  if (!question) return { code: 1, message: '谜面解析失败' }
  const match2 = html.match(/<meta property="og:description" content="([^"]*)">/)
  if (match2) answer = match2[1]
  if (!answer) return { code: 2, message: '谜底解析失败' }
  question = question.replace('的谜底是什么？', '')
  answer = answer.replace(/\s+/g, '')
  const match3 = answer.match(/【([^】]*)】/)
  if (match3) answer = match3[1]
  if (!answer) return { code: 2, message: '谜底解析失败' }
  return { code: 0, question, answer }
}

module.exports = {
  getRiddle: getRiddle1,
  resetRiddle,
}
