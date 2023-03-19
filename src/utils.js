const fs = require('fs')
const prefix = 'data/'

function readJson (filename) {
  filename = prefix + filename
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          data = [] // 不存在就新建
        } else {
          return reject(err)
        }
      } else {
        try {
          data = JSON.parse(data)
        } catch (e) {
          console.error(filename, e)
          data = []
        }
      }
      resolve(data)
    })
  })
}

function writeJson (filename, data) {
  filename = prefix + filename
  fs.writeFile(filename, JSON.stringify(data), () => {})
}

function pager ({ data, page = 1, pageSize = 10, sortBy, mapList, eol = '\n' }) {
  const begin = (page - 1) * pageSize
  const total = data.length
  const totalPages = (((total || 1) - 1) / pageSize | 0) + 1
  if (sortBy) data = data.sort(sortBy)
  data = data.slice(begin, begin + pageSize)
  if (mapList) data = data.map((v, i) => mapList(v, i, begin + i))
  data = data.join(eol) || '没有了捏'
  return data + `\n第 ${page}/${totalPages} 页`
}

module.exports = {
  readJson,
  writeJson,
  pager,
}
