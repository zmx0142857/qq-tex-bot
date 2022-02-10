const request = require('request')
const fs = require('fs')
const path = require('path')
const child = require('child_process')
const message = require('../../message')
const { picDict } = require('../../bot')
const config = {
  name: 'tmp.jpg',
  ...require('../../config').image
}

module.exports = function rotateImage (text, sender, chain) {
  return new Promise((resolve, reject) => {
    const availbleCommands = [
      '90',
      '180',
      '270'
    ]
    text = text || '270'

    const quote = chain.find(item => item.type === 'Quote')
    if (!quote || availbleCommands.indexOf(text) === -1) {
      return message.invalidRotate
    }
    const url = picDict[quote.id]
    if (!url) {
      return message.picNotFound
    }
    const filename = path.join(config.path, config.name)
    const pipe = request(url).pipe(fs.createWriteStream(filename))
    pipe.on('finish', () => {
      child.exec(`magick ${filename} -rotate ${text} ${filename}`, err => {
        if (err) reject(err)
        else {
          resolve([{ type: 'Image', path: config.name }])
        }
      })
    })
  }).catch(err => {
    console.error(err)
    return Promise.resolve(message.error)
  })
}