module.exports = {
  listeners: {},
  addListener (groupId, key, callback) {
    const group = this.listeners[groupId] = this.listeners[groupId] || {}
    group[key] = group[key] || []
    group[key].push(callback)
  },
  removeListener (groupId, key, callback) {
    const group = this.listeners[groupId]
    if (!group) return
    const listeners = group[key]
    if (listeners) {
      group[key] = listeners.filter(cb => cb !== callback)
    }
  },
  trigger (groupId, key, context) {
    const group = this.listeners[groupId]
    if (!group) return
    const listeners = group[key]
    if (listeners) {
      listeners.forEach(callback => callback(context))
    }
  },
  plain (text) {
    return [{
      type: 'Plain',
      text,
    }]
  },
  // 处理消息中的 qq 表情. 如, 滑稽的代码是 \178
  emoji (text) {
    const msg = []
    let match = text.match(/\\(\d+)/)
    while (match) {
      if (match.index) {
        msg.push({ type: 'Plain', text: text.slice(0, match.index) })
      }
      msg.push({ type: 'Face', faceId: parseInt(match[1]) })
      text = text.slice(match.index + match[0].length)
      match = text.match(/\\(\d+)/)
    }
    if (text) {
      msg.push({ type: 'Plain', text })
    }
    return msg
  },
  image (path) {
    if (/^http:|^https:/.test(path)) {
      return [{
        type: 'Image',
        url: path,
      }]
    } else {
      return [{
        type: 'Image',
        path,
      }]
    }
  },
  mathHelp: {
    type: 'Plain',
    text: `用法:
/am <asciimath公式>
/tex <tex公式>
/text <tex文本>
帮助文档在这里喔 https://zmx0142857.github.io/note/#math`
  },
  useTex: {
    type: 'Plain',
    text: '您是不是想要使用 /tex 而不是 /am ?'
  },
  tooWide: {
    type: 'Plain',
    text: '文字太宽了！下次记得换行咯。'
  },
  parseError: {
    type: 'Plain',
    text: ' [error] 无法识别此公式, 格式有误?'
  },
  invalidRotate: {
    type: 'Plain',
    text: '用法: /rotate [90/180/270]'
  },
  error: {
    type: 'Plain',
    text: '出错啦 qwq'
  },
  picNotFound: {
    type: 'Plain',
    text: '出错啦 qwq, 没有找到图片'
  },
}
