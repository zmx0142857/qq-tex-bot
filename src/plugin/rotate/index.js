const request = require('request')
const fs = require('fs')
const path = require('path')
const child = require('child_process')
const message = require('../../message')
const config = require('../../config')

// 处理旋转图片的请求
// 但自己发的图片除外
async function rotateImage (text, sender, chain, bot) {
  const availbleCommands = [
    '90',
    '180',
    '270'
  ]
  text = text || '270'

  const quote = chain.find(item => item.type === 'Quote')
  if (!quote || availbleCommands.indexOf(text) === -1) {
    return [message.invalidRotate]
  }
  const url = bot.picDict[quote.id]
  if (!url) {
    return [message.picNotFound]
  }
  const name = quote.origin[0] && quote.origin[0].text === '[动画表情]' ? 'tmp.gif' : 'tmp.jpg'
  const filename = path.join(config.image.path, name)
  return new Promise((resolve, reject) => {
    const pipe = request(url).pipe(fs.createWriteStream(filename))
    pipe.on('finish', () => {
      child.exec(`magick ${filename} -rotate ${text} ${filename}`, err => {
        if (err) reject(err)
        else {
          resolve([{ type: 'Image', path: name }])
        }
      })
    })
  }).catch(err => {
    console.error(err)
    return Promise.resolve([message.error])
  })
}

module.exports = {
  reg: /^\/rotate/i,
  method: rotateImage,
}
