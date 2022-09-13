const fs = require('fs')

async function getRiddle1 () {
  let text
  try {
    text = await fs.promises.readFile('riddle.txt', 'utf-8')
  } catch (e) {
    console.error(e)
    return { code: 1, message: '获取谜面失败，请稍后再试' }
  }
  const lines = text.trim().split('\n')
  if (!lines.length) return { code: 2, message: '题库空空如也~' }
  let randLine
  while (!randLine) {
    const index = Math.floor(Math.random() * lines.length)
    randLine = lines[index]
  }
  try {
    const [face, category, answer] = randLine.split(',')
    return { code: 0, question: `${face}【${category}】`, answer }
  } catch (e) {
    console.error(e)
    console.log(face, category, answer)
    return { code: 3, message: '谜题解析失败' }
  }
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

module.exports = getRiddle1