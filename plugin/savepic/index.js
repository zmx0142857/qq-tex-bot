const config = require('../../config')
const message = require('../../message')
const savepicService = require('./service')
const { picDict } = require('../../bot')

const extReg = /\.jpg$|\.jpeg$|\.png$|\.gif$/i
const invalidChars = /[/\\*:?"<>|]/g
const adminList = config.auth.admin || []
const saveGroup = config.auth.saveGroup || []

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
  let msg, url
  if (!url) {
    msg = chain.find(m => m.type === 'Image')
    url = msg && msg.url
  }
  if (!url) {
    msg = chain.find(item => item.type === 'Quote')
    if (msg) {
      url = picDict[msg.id]
    }
  }

  // 直接保存
  if (url) {
    console.log('savepic', url)
    const res = await savepicService.add(groupId, fileName, url)
    return res && message.plain(res.msg)
  }

  // 没收到图，等待对方发出图片后保存
  const callback = async ({ bot, url }) => {
    removeListener()
    const res = await savepicService.add(groupId, fileName, url)
    if (res) {
      bot.sendMessage({
        group: senderGroupId,
        message: res.msg,
      })
    }
  }
  message.addListener(senderGroupId, message.imageSymbol, callback)

  const cancelText = '取消'
  const cancel = ({ bot, sender: cancelSender }) => {
    if (sender.id === cancelSender.id) {
      removeListener()
      bot.sendMessage({
        group: senderGroupId,
        message: '已取消',
      })
    }
  }
  message.addListener(senderGroupId, cancelText, cancel)

  const removeListener = () => {
    message.removeListener(senderGroupId, message.imageSymbol, callback)
    message.removeListener(senderGroupId, cancelText, cancel)
  }
  setTimeout(removeListener, 60 * 1000)
  return message.plain('图呢')
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
    reg: /^\/savepic/i,
    method: savePic,
    whiteList: adminList,
    whiteGroup: saveGroup,
  },
  {
    reg: /^\/randpic/i,
    method: randPic,
  },
  {
    reg: extReg,
    method: sendPic,
    trim: false,
  }
]

module.exports = savepicConfig
