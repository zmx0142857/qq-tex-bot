const config = require('../../config')
const message = require('../../message')
const savepicService = require('./service')

const extReg = /\.jpg$|\.jpeg$|\.png$|\.gif$/i
const invalidChars = /[/\\*:?"<>|]/g

function help() {
  return `用法:
/savepic <文件名> <图片>
/savepic -g <文件名> <全局图片>
/savepic -r 刷新缓存
/savepic -d <文件名> 删除图图片
/savepic -m <原文件名> <新文件名> 重命名图片
/randpic <关键字> 随机图片
<文件名>.jpg 发送指定图片`
}

// 提取 groupId
function getGroupId (sender) {
  const res = sender.group && sender.group.id
  return res && String(res)
}

function normalizeFileName(fileName) {
  fileName = fileName.replace(invalidChars, '-')
  if (!extReg.test(fileName)) {
    fileName += '.jpg'
  }
  return fileName
}

// 处理命令参数
async function parseArgs (text, sender) {
  const args = text.split(/\s+/)
  const isAdmin = config.auth.admin.includes(sender.id)
  const isReloadCache = args.includes('-r')
  const isMove = args.includes('-m')
  const isGlobal = args.includes('-g') && isAdmin
  const isDelete = args.includes('-d')

  // -r
  if (isReloadCache) {
    if (!isAdmin) return { code: -1, msg: '不支持选项 -r' }
    savepicService.reload()
    return { code: 0, msg: '缓存已刷新' }
  }

  // fileName
  const fileNames = args.filter(s => s[0] !== '-')
  const len = fileNames.length
  const expectLen = isMove ? 2 : 1
  if (len < expectLen) return { code: -2, msg: help() }
  if (len > expectLen) return { code: -1, msg: '文件名不能含有空白字符' }

  const fileName = normalizeFileName(fileNames[0])

  // -g
  const groupId = isGlobal ? '' : getGroupId(sender)

  // -d
  if (isDelete) {
    if (!isAdmin) return { code: -1, msg: '不支持选项 -d' }
    return savepicService.delete(groupId, fileName)
  }

  // -m
  if (isMove) {
    if (!isAdmin) return { code: -1, msg: '不支持选项 -m' }
    let [newGroupId, newFileName] = fileNames[1].split('/')
    if (!newFileName) {
      newFileName = newGroupId
      newGroupId = groupId
    }
    newFileName = normalizeFileName(newFileName)
    return savepicService.rename(groupId, fileName, newGroupId, newFileName)
  }

  return [groupId, fileName]
}

async function savePic (text, sender, chain, bot) {
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
    msg = chain.find(item => item.type === 'Image')
    url = msg && msg.url
  }
  if (!url) {
    msg = chain.find(item => item.type === 'Quote')
    if (msg) {
      url = bot.picDict[msg.id]
    }
  }

  // 直接保存
  if (url) {
    console.log('savepic', url)
    const res = await savepicService.add(groupId, fileName, url)
    return res && message.plain(res.msg)
  }

  // 没收到图，等待对方发出图片后保存
  const callback = async ({ bot, url, sender: picSender }) => {
    if (sender.id === picSender.id) {
      removeListener()
      const res = await savepicService.add(groupId, fileName, url)
      if (res) {
        bot.sendMessage({
          group: senderGroupId,
          message: res.msg,
        })
      }
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
  if (!fileName || Math.random() > 0.5) {
    const gFileName = await savepicService.choose('', text)
    if (gFileName) {
      groupId = ''
      fileName = gFileName
    }
  }

  return fileName && [
    { type: 'Plain', text: fileName },
    savepicService.image(groupId, fileName),
  ]
}

const savepicConfig = () => [
  {
    reg: /^\/savepic/i,
    method: savePic,
    whiteList: config.auth.admin,
    whiteGroup: config.plugins.savepic.saveGroup || [],
  },
  {
    reg: /^\/randpic/i,
    method: randPic,
    blackGroup: config.plugins.savepic.blackGroup,
  },
  {
    reg: extReg,
    method: sendPic,
    trim: false,
    blackGroup: config.plugins.savepic.blackGroup,
  }
]

module.exports = savepicConfig
