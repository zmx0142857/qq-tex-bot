const imageSymbol = Symbol('Image')

module.exports = {
  imageSymbol,
  listeners: {},
  addListener (groupId, key, callback) {
    const group = this.listeners[groupId] = this.listeners[groupId] || {}
    if (key instanceof RegExp) { // 正则表达式
      group.match = group.match || []
      group.match.push([key, callback])
    } else { // key is String or Symbol // 严格相等
      group.eq = group.eq || {}
      group.eq[key] = group.eq[key] || []
      group.eq[key].push(callback)
    }
  },
  removeListener (groupId, key, callback) {
    const group = this.listeners[groupId]
    if (!group) return
    if (key instanceof RegExp) {
      if (group.match) {
        group.match = group.match.filter(pair => pair[1] !== callback)
      }
    } else {
      const listeners = group.eq && group.eq[key]
      if (listeners) {
        group.eq[key] = listeners.filter(cb => cb !== callback)
      }
    }
  },
  match (groupId, key, context) {
    const group = this.listeners[groupId]
    if (!group) return
    if (group.match) {
      group.match.forEach(pair => {
        if (pair[0].test(key)) {
          pair[1](context)
        }
      })
    }
  },
  trigger (groupId, key, context) {
    const group = this.listeners[groupId]
    if (!group) return
    const listeners = group.eq && group.eq[key]
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
  mathHelp: `用法:
/am <asciimath公式>
/tex <tex公式>
/text <tex文本>
帮助文档在这里喔: https://asciimath.widcard.win
旧版文档: https://zmx0142857.github.io/note`,
}
