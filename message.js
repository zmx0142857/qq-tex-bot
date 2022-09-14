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
帮助文档在这里喔 https://icouldfran.icu/note/#math`
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
