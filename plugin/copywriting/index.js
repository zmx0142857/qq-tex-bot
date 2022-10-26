const message = require('../../message')
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
    if (a.length === store[key].argc) {
      return message.plain(store[key].template(a))
    } else {
      return message.plain(store[key].help)
    }
  }
}

async function main (text) {
  if (text === '-r') {
    loadStore()
    // TODO 并不会刷新
    return message.plain('缓存已刷新')
  } else {
    return message.plain('可用文案: ' + Object.keys(store).join('、'))
  }
}

function loadStore () {
  store = require('./store')
  mod.length = 1
  mod.push(
    ...Object.keys(store).map(key => ({
      reg: new RegExp('/' + key),
      method: factory(key),
    }))
  )
}

loadStore()
module.exports = mod
