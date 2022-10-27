const message = require('../../message')
const fs = require('fs').promises
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
      const res = template.replace(/\${a\[(\d+)]}/g, (match, i) => a[i])
      return message.plain(res)
    } else {
      return message.plain(help)
    }
  }
}

async function main (text) {
  if (text === '-r') {
    await loadStore()
    // TODO 并不会刷新
    return message.plain('缓存已刷新')
  } else {
    return message.plain('可用文案: ' + Object.keys(store).join('、'))
  }
}

async function loadStore () {
  const data = await fs.readFile('data/copywriting.json', 'utf-8')
  store = JSON.parse(data)
  mod.length = 1
  mod.push(
    ...Object.keys(store).map(key => ({
      reg: new RegExp('^/' + key),
      method: factory(key),
    }))
  )
}

loadStore()
module.exports = mod
