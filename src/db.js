const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

let db

module.exports = async function getDB () {
  if (!db) {
    db = await open({
      filename: 'data/database.db',
      driver: sqlite3.Database
    })
    db.on('trace', console.error)
  }
  return db
}
