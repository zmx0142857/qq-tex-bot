const config = require('../../config')
const message = require('../../message')
const request = require('request')
const fs = require('fs')

const extReg = /\.jpg$|\.jpeg$|\.png|\.gif$/i
const invalidChars = /[/\\*:?"<>|]/g
const moduleName = 'savepic'
const picDir = `${config.image.path}/${moduleName}`
const adminList = config.auth.admin || []
const saveGroup = config.auth.saveGroup || []

function help() {
  return message.plain(`用法:
/savepic <文件名> <图片>
/randpic 随机图片
<文件名>.jpg 发送指定图片`)
}

function mkdir (dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

function promise (fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (err, res) => {
      if (err) reject(err)
      resolve(res)
    })
  })
}

// 提取文件 path
function getFilePath (text, sender) {
  const args = text.split(/\s+/)
  let fileName = args.find(s => s[0] !== '-')
  if (!fileName) return
  fileName = fileName.replace(invalidChars, '-')
  if (!extReg.test(fileName)) {
    fileName += '.jpg'
  }

  // global function is admin-only
  const groupId = sender.group && sender.group.id
  const isGlobal = args.indexOf('-g') > -1 && adminList.includes(sender.id)
  const dir = isGlobal ? picDir : picDir + '/' + groupId
  mkdir(dir)
  return [dir, fileName]
}

function choice (arr) {
  return arr[Math.random() * arr.length | 0]
}

async function chooseFile (dir) {
  if (!fs.existsSync(dir)) return
  try {
    const files = await promise(fs.readdir, dir)
    if (files.length > 0) {
      return choice(files)
    }
  } catch (e) {
    console.error(e)
  }
}

async function savePic (text, sender, chain) {
  if (!text) return help()

  const groupId = sender.group && sender.group.id
  if (!groupId) {
    return message.plain('抱歉，不支持私聊存图')
  }

  const res = getFilePath(text, sender)
  if (!res) return help()

  const fileName = res[1], filePath = res[0] + '/' + res[1]
  if (fs.existsSync(filePath)) {
    return message.plain('图片已存在，请重新命名')
  }

  // 在 chain 中找图
  const msg = chain.find(m => m.type === 'Image' && m.url)
  if (msg) {
    try {
      console.log(moduleName, msg.url)
      request(msg.url).pipe(fs.createWriteStream(filePath))
    } catch (e) {
      console.error(e)
    }
  } else {
    console.log('找不到图:', chain)
    return message.plain('图呢')
  }
  return message.plain('已保存 ' + fileName)
}

async function sendPic (text, sender, chain) {
  text = text.replace(invalidChars, '-')
  if (!text) return

  const groupId = sender.group && sender.group.id
  if (groupId) {
    const filePath = picDir + '/' + groupId + '/' + text
    if (fs.existsSync(filePath)) {
      return message.image(`${moduleName}/${groupId}/${text}`)
    }
  }

  // fallback to global dir
  const globalFilePath = picDir + '/' + text
  if (fs.existsSync(globalFilePath)) {
    return message.image(`${moduleName}/${text}`)
  }
}

async function randPic (text, sender, chain) {
  let fileName, filePath

  const groupId = sender.group && sender.group.id
  if (groupId && Math.random() > 0.5) {
    const dir = picDir + '/' + groupId
    fileName = await chooseFile(dir)
    if (fileName) {
      filePath = moduleName + '/' + groupId + '/' + fileName
    }
  }

  // fallback to global dir
  if (!filePath || Math.random() > 0.5) {
    fileName = await chooseFile(picDir)
    if (fileName) {
      filePath = moduleName + '/' + fileName
    }
  }

  return filePath && [{
    type: 'Plain',
    text: fileName
  }, {
    type: 'Image',
    path: filePath
  }]
}

module.exports = [
  {
    reg: /^\/savepic/i,
    method: savePic,
    whiteList: adminList,
    whiteGroup: saveGroup,
  },
  {
    reg: /^\/randpic$/i,
    method: randPic,
  },
  {
    reg: extReg,
    method: sendPic,
    trim: false,
  }
]
