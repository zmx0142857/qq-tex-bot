const message = require('../../message')
const fs = require('fs')
let store

const mod = [
  {
    reg: /^\/文案/,
    method: main,
  },
]

function factory (key) {
  return async function (text) {
    const a = text ? text.split(/\s+/) : []
    const { argc, template, help } = store[key]
    if (a.length === argc) {
      const res = template.replace(/\${([^}]*)}/g, (match, src) => {
        return Function(['a'], 'return ' + src)(a)
      })
      return message.plain(res)
    } else {
      return message.plain(help)
    }
  }
}

async function main (text) {
  if (text === '-r') {
    loadStoreSync()
    return message.plain('缓存已刷新')
  } else {
    return message.plain('可用文案: ' + Object.keys(store).join('、'))
  }
}

function loadStoreSync() {
  const data = fs.readFileSync('data/copywriting.json', 'utf-8')
  updateStore(data)
}

function updateStore (data) {
  store = JSON.parse(data)
  mod.length = 1
  mod.push(
    ...Object.keys(store).map(key => ({
      reg: new RegExp('^/' + key),
      method: factory(key),
    }))
  )
}

loadStoreSync()
module.exports = mod
