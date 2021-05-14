const readline = require('readline')

const cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

cli.on('close', () => {
  console.log('\ncli closed. ctrl-c again to exit') // 正确换行
})

module.exports = function interact (callback) {
  cli.question('> ', input => {
    callback(input)
    interact(callback)
  })
}
