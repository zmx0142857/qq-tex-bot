const config = require('./config')
const Bot = config.server ? require('./platform/mirai') : require('./platform/gocq')
module.exports = new Bot()
