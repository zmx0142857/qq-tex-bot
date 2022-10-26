const message = require('../../message')
const store = require('./store')

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
  return message.plain('可用文案: ' + Object.keys(store).join('、'))
}

module.exports = [
  {
    reg: /^\/文案/,
    method: main,
  },
  ...Object.keys(store).map(key => ({
    reg: new RegExp('/' + key),
    method: factory(key),
  })),
]
