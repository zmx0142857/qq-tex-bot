const { pager } = require('../../utils')
const getDB = require('../../db')

async function load (table, groupId, page) {
  const db = await getDB()
  const data = await db.all(`select * from ${table} where groupid=? order by score desc`, groupId)
  return pager({
    data,
    page,
    mapList: (item, index, totalIndex) => `${totalIndex + 1}. ${item.name} ${item.score}`
  })
}

async function save (table, groupId, sender) {
  const db = await getDB()
  const qq = sender.id
  const name = sender.memberName || sender.name
  const count = await db.get(`select count(*) as count from ${table} where groupid=? and qq=?`, groupId, qq)
  if (count.count > 0) {
    await db.run(`update ${table} set score=score+1, name=? where groupid=? and qq=?`, name, groupId, qq)
  } else {
    await db.run(`insert into ${table} (groupid, qq, name, score) values (?,?,?,?)`, groupId, qq, name, 1)
  }
}

async function loadRank (groupId, page) {
  return load('riddle_rank', groupId, page)
}

async function saveRank (groupId, sender) {
  return save('riddle_rank', groupId, sender)
}

async function loadScore (groupId, page) {
  return load('riddle_score', groupId, page)
}

async function saveScore (groupId, sender) {
  return save('riddle_score', groupId, sender)
}

async function clearScore (groupId) {
  const db = await getDB()
  await db.run('delete from riddle_score where groupid=?', groupId)
}

module.exports = {
  loadRank,
  saveRank,
  loadScore,
  saveScore,
  clearScore,
}
