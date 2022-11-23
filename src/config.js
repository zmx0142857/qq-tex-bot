const fs = require('fs')
let config = {}

function loadConfig () {
  const configStr = fs.readFileSync('config.js', 'utf-8')
  const module = { exports: {} }
  // eslint-disable-next-line no-new-func
  new Function(['module'], configStr)(module)
  console.log('config:', module.exports)
  config = module.exports
  config.loadConfig = loadConfig
}

loadConfig()
module.exports = config
