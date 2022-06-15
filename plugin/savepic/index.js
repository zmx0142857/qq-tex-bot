const config = require('../../config')
const message = require('../../message')
const savepicService = require('./service')

const extReg = /\.jpg$|\.jpeg$|\.png|\.gif$/i
const invalidChars = /[/\\*:?"<>|]/g
const adminList = config.auth.admin || []
const saveGroup = config.auth.saveGroup || []

function help() {
  return `用法:
/savepic <文件名> <图片>
/randpic 随机图片
<文件名>.jpg 发送指定图片`
}

// 提取 groupId
function getGroupId (sender) {
  const res = sender.group && sender.group.id
  return res && String(res)
}

// 提取文件 path
function parseFilePath (text, sender) {
  const args = text.split(/\s+/)

  const isReloadCache = args.indexOf('-r') > -1
  const isAdmin = adminList.includes(sender.id)
  if (isReloadCache) {
    if (isAdmin) return { code: 0, msg: '缓存已刷新' }
    return { code: -1, msg: '未知的选项 -r' }
  }

  let fileName = args.find(s => s[0] !== '-')
  if (!fileName) return { code: -2, msg: help() }
  fileName = fileName.replace(invalidChars, '-')
  if (!extReg.test(fileName)) {
    fileName += '.jpg'
  }

  const isGlobal = args.indexOf('-g') > -1 && isAdmin
  const groupId = isGlobal ? '' : getGroupId(sender)
  return [groupId, fileName]
}

async function savePic (text, sender, chain) {
  if (!text) return message.plain(help())

  if (!getGroupId(sender)) {
    return message.plain('抱歉，不支持私聊存图')
  }

  const res = parseFilePath(text, sender)
  if (res.code !== undefined) return res.msg
  const [groupId, fileName] = res

  // 在 chain 中找图
  const msg = chain.find(m => m.type === 'Image' && m.url)
  if (msg) {
    console.log('savepic', msg.url)
    const res = await savepicService.add(groupId, fileName, msg.url)
    return res && message.plain(res.msg)
  } else {
    console.log('找不到图:', chain)
    return message.plain('图呢')
  }
}

async function sendPic (text, sender, chain) {
  text = text.replace(invalidChars, '-')
  if (!text) return

  let hasFile
  let groupId = getGroupId(sender)
  if (groupId) {
    hasFile = await savepicService.has(groupId, text)
  } 
  // fallback to global dir
  if (!hasFile) {
    groupId = ''
    hasFile = await savepicService.has(groupId, text)
  }
  return hasFile && [savepicService.image(groupId, text)]
}

async function randPic (text, sender, chain) {
  let fileName
  let groupId = getGroupId(sender)

  if (groupId && Math.random() > 0.5) {
    fileName = await savepicService.choose(groupId)
  }

  // fallback to global dir
  if (!fileName || Math.random() > 0.5) {
    groupId = ''
    fileName = await savepicService.choose(groupId)
  }

  return fileName && [
    { type: 'Plain', text: fileName },
    savepicService.image(groupId, fileName),
  ]
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
