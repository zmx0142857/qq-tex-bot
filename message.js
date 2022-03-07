module.exports = {
  plain (text) {
    return [{
      type: 'Plain',
      text,
    }]
  },
  mathHelp: {
    type: 'Plain',
    text: `用法:
/am <asciimath公式>
/tex <tex公式>
帮助文档在这里喔 https://zmx0142857.gitee.io/note/#math`
  },
  useTex: {
    type: 'Plain',
    text: '您是不是想要使用 /tex 而不是 /am ?'
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
