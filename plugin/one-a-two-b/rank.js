const fs = require('fs')

function readFileData (groupId) {
  const filename = `1a2b.${groupId}.json`
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) {
        if (err.code === 'ENOENT')
          data = [] // 不存在就新建
        else
          return reject(err)
      } else {
        data = JSON.parse(data)
      }
      resolve(data)
    })
  })
}

async function loadRank (groupId) {
  const data = await readFileData(groupId)
  if (!data.length) return '本群暂无成绩'
  return data.sort((a, b) => b.score - a.score)
    .map(d => `${d.name} ${d.score}`).join('\n')
}

async function saveRank (groupId, sender) {
  const filename = `1a2b.${groupId}.json`
  const data = await readFileData(groupId)
  const record = data.find(d => d.id === sender.id)
  if (record) {
    record.score += 1
  } else {
    data.push({ id: sender.id, name: sender.memberName || sender.name, score: 1 })
  }
  fs.writeFileSync(filename, JSON.stringify(data))
}

module.exports = {
  loadRank,
  saveRank,
}
