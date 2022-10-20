const message = require('../../message')

async function 小编体 (text) {
  const a = text.split(/\s/)
  if (a.length === 3) {
    return message.plain(`${a[0]}${a[1]}是怎么回事呢？${a[0]}相信大家都很熟悉，但是${a[0]}${a[1]}是怎么回事呢，下面就让小编带大家一起了解吧。

${a[0]}${a[1]}，其实就是${a[2]}，大家可能会很惊讶${a[0]}怎么会${a[1]}呢？但事实就是这样，小编也感到非常惊讶。

这就是关于${a[0]}${a[1]}的事情了，大家有什么想法呢，欢迎在评论区告诉小编一起讨论哦！`)
  } else {
    return message.plain(`用法:
/小编体 主语 谓语 换种说法
如: /小编体 数学 是人类的发明还是发现 数学是否为人类所创造`)
  }
}

async function main (text) {
  return message.plain('可用文案: 小编体')
}

module.exports = [
  {
    reg: /^\/文案/,
    method: main,
  },
  {
    reg: /^\/小编体/,
    method: 小编体,
  }
]
