const { readJson, writeJson, pager } = require('../../utils')

async function loadRank (groupId, page) {
  const filename = `1a2b.${groupId}.json`
  return pager({
    data: await readJson(filename),
    page,
    sortBy: (a, b) => b.score - a.score,
    mapList: (item, index, totalIndex) => `${totalIndex + 1}. ${item.name} ${item.score}`
  })
}

async function saveRank (groupId, sender) {
  const filename = `1a2b.${groupId}.json`
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

module.exports = {
  loadRank,
  saveRank,
}
