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

async function loadRank (groupId, page = 1) {
  const pageSize = 10
  const begin = (page-1) * pageSize
  const data = await readFileData(groupId)
  const total = data.length
  const totalPages = (total / pageSize | 0) + 1
  const res = data.sort((a, b) => b.score - a.score)
    .slice(begin, begin + pageSize)
    .map((d, i) => `${begin+i+1}. ${d.name} ${d.score}`)
    .join('\n') || '没有了捏'
  return res + `\n第 ${page}/${totalPages} 页`
}

async function saveRank (groupId, sender) {
  const filename = `1a2b.${groupId}.json`
  const data = await readFileData(groupId)
  const record = data.find(d => d.id === sender.id)
  if (record) {
    record.score += 1
    record.name = sender.memberName || sender.name // 更新名片
  } else {
    data.push({ id: sender.id, name: sender.memberName || sender.name, score: 1 })
  }
  fs.writeFile(filename, JSON.stringify(data), () => {})
}

module.exports = {
  loadRank,
  saveRank,
}
