module.exports = {
  server: {
    baseUrl: 'http://localhost:8080',
    authKey: '', // mirai-api-http 提供的 authKey
    qq: 123456, // 机器人的 qq 号
  },
  groups: [
    123456, // 机器人加入的群
  ],
  image: {
    engine: 'magick', // 或 phantom
    path: '', // 'mirai/data/net.mamoe.mirai-api-http/images' 的绝对路径
    name: 'tmp.png',
  }
}
