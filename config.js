module.exports = {
  server: {
    verifyKey: 'INITKEY2vT9QXtl', // mirai-api-http 提供的 verifyKey
    qq: 2071245907, // 机器人的 qq 号
  },
  groups: {
    726542042: '数学游乐场', // 群号和群名称
    826776244: '鸽巢',
    1034267197: 'manim幼儿园养鸽场',
  },
  image: {
    // 图片目录绝对路径. 分隔符一律用斜杠 (/), 不要用反斜杠, 即使你是 windows
    path: 'D:/app/mirai/data/net.mamoe.mirai-api-http/images',
  },
  auth: {
    admin: [892298182], // 你的 qq 号
  },
  plugins: [
    'math',
    'savepic',
    '1a2b',
    // 'rotate',
  ],
}
