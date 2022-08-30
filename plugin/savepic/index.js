const config = require('../../config')
const message = require('../../message')
const savepicService = require('./service')

const extReg = /\.jpg$|\.jpeg$|\.png|\.gif$/i
const invalidChars = /[/\\*:?"<>|]/g
const adminList = config.auth.admin || []
const saveGroup = config.auth.saveGroup || []
const savepicSession = {}

function help() {
  return `用法:
/savepic <文件名> <图片>
/savepic -g <文件名> <全局图片>
/savepic -r 刷新缓存
/savepic -d <文件名> 删除文件
/randpic 随机图片
<文件名>.jpg 发送指定图片`
}

// 提取 groupId
function getGroupId (sender) {
  const res = sender.group && sender.group.id
  return res && String(res)
}

// 处理命令参数
async function parseArgs (text, sender) {
  const args = text.split(/\s+/)

  // -r
  const isReloadCache = args.indexOf('-r') > -1
  const isAdmin = adminList.includes(sender.id)
  if (isReloadCache) {
    if (!isAdmin) return { code: -1, msg: '不支持选项 -r' }
    savepicService.reload()
    return { code: 0, msg: '缓存已刷新' }
  }

  // fileName
  const fileNames = args.filter(s => s[0] !== '-')
  if (fileNames.length > 1) return { code: -1, msg: '文件名不能含有空白字符' }
  if (fileNames.length === 0) return { code: -2, msg: help() }
  let fileName = fileNames[0]
  fileName = fileName.replace(invalidChars, '-')
  if (!extReg.test(fileName)) {
    fileName += '.jpg'
  }

  // -g
  const isGlobal = args.indexOf('-g') > -1 && isAdmin
  const groupId = isGlobal ? '' : getGroupId(sender)

  // -d
  const isDelete = args.indexOf('-d') > -1
  if (isDelete) {
    if (isAdmin) return await savepicService.delete(groupId, fileName)
    return { code: -1, msg: '不支持选项 -d' }
  }

  return [groupId, fileName]
}

async function savePic (text, sender, chain) {
  if (!text) return message.plain(help())

  const senderGroupId = getGroupId(sender)
  if (!senderGroupId) {
    return message.plain('抱歉，不支持私聊存图')
  }

  const res = await parseArgs(text, sender)
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
    savepicSession[senderGroupId] = savepicSession[senderGroupId] || {}
    const groupDict = savepicSession[senderGroupId]
    groupDict[sender.id] = { groupId, fileName }
    setTimeout(() => {
      delete groupDict[sender.id]
    }, 60 * 1000)
    return message.plain('图呢')
  }
}

// 完成保存图片
async function savePicComplete (groupId, senderId, url) {
  const groupDict = savepicSession[groupId]
  if (groupDict) {
    const item = groupDict[senderId]
    if (item) {
      const res = await savepicService.add(item.groupId, item.fileName, url)
      delete groupDict[senderId]
      return res && message.plain(res.msg)
    }
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

  if (groupId && (text || Math.random() > 0.5)) {
    fileName = await savepicService.choose(groupId, text)
  }

  // fallback to global dir
  if (!fileName || (!text && Math.random() > 0.5)) {
    groupId = ''
    fileName = await savepicService.choose(groupId, text)
  }

  return fileName && [
    { type: 'Plain', text: fileName },
    savepicService.image(groupId, fileName),
  ]
}

const savepicConfig = [
  {
    reg: /^\/savepic /i,
    method: savePic,
    whiteList: adminList,
    whiteGroup: saveGroup,
  },
  {
    reg: /^\/randpic /i,
    method: randPic,
  },
  {
    reg: extReg,
    method: sendPic,
    trim: false,
  }
]

savepicConfig.savePicComplete = savePicComplete

module.exports = savepicConfig
