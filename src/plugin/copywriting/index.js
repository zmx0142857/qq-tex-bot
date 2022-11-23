const message = require('../../message')
const fs = require('fs')
const copywritingGroup = require('../../config').plugins.whiteGroup
let store

const mod = [
  {
    reg: /^\/文案/,
    method: main,
    whiteGroup: copywritingGroup,
  },
]

function factory (key) {
  return async function (text) {
    // kfc is available on thursday only
    // there is not need to convert timezone
    if (key.toLowerCase() === 'kfc' && new Date().getDay() !== 4) return message.plain('小店已经打烊，客官请周四再来吧')
    const a = text ? text.split(/\s+/) : []
    const { argc, template, help } = store[key]
    const t = Array.isArray(template) ? template[Math.floor(Math.random() * template.length)] : template
    if (a.length === argc) {
      let res = t.replace(/\${([^}]*)}/g, (match, src) => {
        // eslint-disable-next-line no-new-func
        return Function(['a'], 'return ' + src)(a)
      })
      if (res.length > 1000) res = res.slice(0, 997) + '...'
      return message.emoji(res)
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
  return mod
}

function updateStore (data) {
  store = JSON.parse(data)
  mod.length = 1
  mod.push(
    ...Object.keys(store).map(key => ({
      reg: new RegExp('^/' + key, 'i'),
      method: factory(key),
      whiteGroup: copywritingGroup,
    }))
  )
}

module.exports = loadStoreSync
