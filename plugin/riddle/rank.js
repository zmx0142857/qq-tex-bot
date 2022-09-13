const { readJson, writeJson, pager } = require('../../utils')

async function load (filename, page) {
  return pager({
    data: await readJson(filename),
    page,
    sortBy: (a, b) => b.score - a.score,
    mapList: (item, index, totalIndex) => `${totalIndex+1}. ${item.name} ${item.score}`
  })
}

async function save (filename, sender) {
  const data = await readJson(filename)
  const record = data.find(d => d.id === sender.id)
  if (record) {
    record.score += 1
    record.name = sender.memberName || sender.name // 更新名片
  } else {
    data.push({ id: sender.id, name: sender.memberName || sender.name, score: 1 })
  }
  writeJson(filename, data)
}

async function loadRank (groupId, page) {
  const filename = `riddle-rank.${groupId}.json`
  return load(filename, page)
}

async function saveRank (groupId, sender) {
  const filename = `riddle-rank.${groupId}.json`
  return save(filename, sender)
}

async function loadScore (groupId, page) {
  const filename = `riddle-score.${groupId}.json`
  return load(filename, page)
}

async function saveScore (groupId, sender) {
  const filename = `riddle-score.${groupId}.json`
  return save(filename, sender)
}

async function clearScore (groupId) {
  const filename = `riddle-score.${groupId}.json`
  writeJson(filename, [])
}

module.exports = {
  loadRank,
  saveRank,
  loadScore,
  saveScore,
  clearScore,
}
