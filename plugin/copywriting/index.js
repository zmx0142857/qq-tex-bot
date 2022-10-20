const message = require('../../message')

const dict = {
  async 小编体 (text) {
    const a = text.split(/\s/)
    if (a.length === 3) {
      return message.plain(`${a[0]}${a[1]}是怎么回事呢？${a[0]}相信大家都很熟悉，但是${a[0]}${a[1]}是怎么回事呢，下面就让小编带大家一起了解吧。

${a[0]}${a[1]}，其实就是${a[2]}，大家可能会很惊讶${a[0]}怎么会${a[1]}呢？但事实就是这样，小编也感到非常惊讶。

这就是关于${a[0]}${a[1]}的事情了，大家有什么想法呢，欢迎在评论区告诉小编一起讨论哦！`)
    } else {
      return message.plain(`用法:
/小编体 主语 谓语 换种说法
如:
/小编体 数学 是人类的发明还是发现 数学是否为人类所创造`)
    }
  },
  async 你说的对 (text) {
    const a = text.split(/\s/)
    if (a.length === 8) {
      return message.plain(`你说的对，但是《${a[0]}》是由${a[1]}自主研发的一款全新${a[2]}游戏。游戏发生在一个被称作「${a[3]}」的幻想世界，在这里，你将扮演一位名为「${a[4]}」的神秘角色，在自由的旅行中邂逅性格各异、能力独特的${a[5]}们，和他们一起${a[6]}——同时，逐步发掘「${a[7]}」的真相。`)
    } else {
      return message.plain(`用法:
/你说的对 游戏名 游戏作者 游戏类别 游戏世界 玩家名字 NPC名字 一起做的事 待发掘的真相
如:
/你说的对 Nazo_Game 高材生 yy 互联网 猫娘 大佬 发电 卖弱`)
    }
  },
}

async function main (text) {
  return message.plain('可用文案: ' + Object.keys(dict).join('、'))
}

module.exports = [
  {
    reg: /^\/文案/,
    method: main,
  },
  {
    reg: /^\/小编体/,
    method: dict.小编体,
  },
  {
    reg: /^\/你说的对/,
    method: dict.你说的对,
  },
]
