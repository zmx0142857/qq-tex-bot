const config = require('../../config')
const message = require('../../message')
const request = require('request')
const fs = require('fs')

const extReg = /\.jpg$|\.jpeg$|\.png|\.gif$/i
const picDir = `${config.image.path}/save-pic`

function help() {
  return message.plain(`用法:
/savepic <文件名>
<关键字>.jpg | <关键字>.png | <关键字>.gif
`)
}

function mkdir () {
  if (!fs.existsSync(picDir)) {
    fs.mkdirSync(picDir)
  }
}

async function savePic (text, sender, chain) {
  if (text === '') {
      return help()
  } else {
    // 提取文件名
    let [fileName, keyword] = text.split(/\s+/)
    if (!fileName) {
      return help()
    }
    if (!extReg.test(fileName)) {
      fileName += '.jpg'
    }
    const filePath = picDir + '/' + fileName
    if (fs.existsSync(filePath)) {
      return message.plain('图片已存在，请重新命名')
    }

    // 在 chain 中找图
    const msg = chain.find(m => m.type === 'Image' && m.url)
    if (msg) {
      try {
        mkdir()
        console.log('save-pic', msg.url)
        request(msg.url).pipe(fs.createWriteStream(filePath))
      } catch (e) {
        console.log(e)
      }
    } else {
      console.log('找不到图:', chain)
      return message.plain('图呢')
    }
    return message.plain('已保存')
  }
}

async function sendPic (text, sender, chain) {
  if (!fs.existsSync(picDir + '/' + text)) {
    return message.picNotFound;
  }
  return message.image('save-pic/' + text)
}

module.exports = {
  extReg,
  savePic,
  sendPic,
}
