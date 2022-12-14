const fs = require('fs')
const getDB = require('../../db')

async function initStore (groupId) {
  const db = await getDB()
  const line = await db.get('select * from riddle_question where groupid=? order by no desc limit 1', groupId)
  if (line) return line // 尝试取一条谜

  // 读 txt 并入库
  let text
  try {
    text = await fs.promises.readFile('data/riddle.txt', 'utf-8')
  } catch (e) {
    console.error(e)
    return { code: 1, message: '获取谜面失败，请稍后再试' }
  }

  let datas
  if (!text.trim()) datas = []
  else datas = text.trim().split('\n').sort(() => Math.random() < 0.5 ? -1 : 1)
  datas.unshift('') // 哨兵
  await db.run('insert into riddle_question (groupid, no, data) values ' + datas.map(data => '(?,?,?)').join(',\n'),
    ...datas.map((data, index) => [groupId, index, data]).flat()
  )
  const no = datas.length - 1
  return { groupid: groupId, no, data: datas[no] }
}

async function deleteOneRiddle (groupId, no) {
  const db = await getDB()
  await db.run('delete from riddle_question where groupid=? and no=?', groupId, no)
}

async function getRiddle (groupId) {
  const line = await initStore(groupId)
  if (line.code) return line
  if (!line.no) return { code: 2, message: '已经没有更多谜题了！' }

  deleteOneRiddle(groupId, line.no)

  try {
    const [face, category, answer, hint] = line.data.split(',')
    const ret = {
      code: 0,
      question: `${face}【${category}】`,
      answer: answer.trim(),
      raw: line.data,
      hint: hint || '没有提示捏',
    }
    return ret
  } catch (e) {
    console.error(e)
    console.error('line:', line)
    return { code: 3, message: '谜题解析失败' }
  }
}

async function putBackRiddle (groupId, raw) {
  const db = await getDB()
  const max = await db.get('select max(no) as max from riddle_question where groupid=?', groupId)
  if (max.max === null) return console.error('putBack failed: store not inited')
  await db.run('insert into riddle_question (groupid, no, data) values (?,?,?)', groupId, max.max + 1, raw)
}

async function resetRiddle (groupId) {
  const db = await getDB()
  await db.run('delete from riddle_question where groupid=?', groupId)
}

module.exports = {
  getRiddle,
  resetRiddle,
  putBackRiddle,
}
