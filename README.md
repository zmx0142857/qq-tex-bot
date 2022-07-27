# qq-tex-bot

使用 [mirai](https://github.com/mamoe/mirai), [mirai-js](https://github.com/Drincann/Mirai-js) 和 [mathjax](http://mathjax.org) 实现的用于渲染数学公式的 qq 机器人.

## 功能展示

目前支持的命令:

- `/am`: [asciimath](https://zmx0142857.gitee.io/note/#math/example/asciimath), 简易版本的公式标记语言
- `/tex`: tex 公式, 较复杂, 但功能更全
- `/rotate`: 旋转图片 (但自己发的图片除外). 妈妈再也不怕我得颈椎病了
- `/savepic`: 保存群聊图片, 化身弔图稽器人
- `/1a2b`: 老少皆宜的猜数字小游戏

<div>
<img src="img/S10509-115328.jpg" alt="图1" width="45%">
<img src="img/S10509-115344.jpg" alt="图2" width="45%">
</div>

## 快速上手

### 1. 安装 mirai

mirai 是全平台、开源的 qq 机器人框架, 使用 java 和 kotlin 编写.  [官方用户手册](https://github.com/mamoe/mirai/blob/dev/docs/UserManual.md)

- 确保 java 版本至少是 11
- 新建目录 `mirai`, 下载 [mcl-installer](https://github.com/iTXTech/mcl-installer/releases) 或 [miral-console-loader](https://github.com/iTXTech/mirai-console-loader/releases), 然后运行

- 安装 mirai-api-http 插件, 用于提供 http 接口:
  ```shell
  ./mcl --update-package net.mamoe:mirai-api-http --type plugin --channel stable
  ```
- 安装[滑块验证模块](https://github.com/project-mirai/mirai-login-solver-selenium):
  ```shell
  ./mcl --update-package net.mamoe:mirai-login-solver-selenium --type plugin --channel nightly
  ```
- 运行 `./mcl`, 一切正常的话, mirai-console 就会启动起来.
- 最后, 参考官方说明, 可以配置一下 qq 的自动登录.
  ```shell
  /autoLogin add <account> <password> [passwordKind]    # 添加自动登录
  ```

#### Trouble Shooting

- 默认情况下 mirai 以 android 协议登录, 此时不允许再用 android
  手机登录同一个账号, 否则 mirai 会被强制下线.
- mirai 的更新可能会出 bug. 如果遇到问题, 可以编辑 `config.json` 把 mirai
  的 channel 改成 stable. 然后重启 `./mcl` 即可.
- 如要将机器人部署到服务器, 建议先在自己电脑上登录 mirai console,
  并进行滑块验证.  成功以后关闭 mirai console,
  将 `bots/<qq号>/device.json` 文件拷贝到服务器. 这时服务器应该能顺利登录.

### 2. 安装 node js 依赖

假定已经安装最新版本的 node js. 在 qq-tex-bot 项目根目录 (`package.json` 所在的目录) 下运行

```shell
npm install
```

> 安装过程如遇到 phantomjs 下载失败, 可以手动下载到指定的目录中:
> ```text
> Downloading https://github.com/Medium/phantomjs/releases/download/v2.1.1/phantomjs-2.1.1-windows.zip
> Saving to C:\Users\Administrator\AppData\Local\Temp\phantomjs\phantomjs-2.1.1-windows.zip
> Receiving...
> Error making request.
> Error: connect ETIMEDOUT *.*.*.*:443
>     at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1148:16)
> ```
> 比如上面这种情况, 只需到 https://github.com/Medium/phantomjs/releases/download/v2.1.1/phantomjs-2.1.1-windows.zip 下载文件, 保存到 C:\Users\Administrator\AppData\Local\Temp\phantomjs\phantomjs-2.1.1-windows.zip, 然后重新运行 `npm install` 即可.

在项目根目录下新建 `config.js`, 填写必要信息:

```js
module.exports = {
  server: {
    authKey: '', // mirai-api-http 提供的 authKey
    qq: 123456, // 机器人的 qq 号
  },
  groups: {
    112233: '群名称', // 群号和群名称
  },
  image: {
    // 图片目录绝对路径. 分隔符一律用斜杠 (/), 不要用反斜杠, 即使你是 windows
    path: '??/mirai/data/net.mamoe.mirai-api-http/images',
  },
  auth: {
    admin: [123124123], // 你的 qq 号
    blackList: [], // 黑名单
    // whiteList: [], // 白名单
    // blackGroup: [], // 群聊黑名单
    // whiteGroup: [], // 群聊白名单
  },
  // 开启的插件列表
  plugins: [
    'math',
    // 'savepic',
    // '1a2b',
    // 'rotate',
  ],
}
```

|参数|解释|类型|必填|
|----|----|----|----|
| server.authKey | mirai-api-http 提供的 authKey, 请妥善保存, 不要泄露 | String | 必填 |
| server.qq | 机器人的 qq 号 | Number | 必填 |
| groups | 机器人加入的群, 以 `群号: 群名` 的格式填写, 可填多个 | Object | 必填 |
| image.path | mirai 图片目录的绝对路径. 分隔符一律用斜杠 (/), 不要用反斜杠, 即使你是 windows | String | 必填 |
| server.baseUrl | mirai 服务的地址 | String | 默认值 http://localhost:8080 |
| tex.ex | 公式的字体大小 | Number | 默认值 16 |
| image.engine | svg 转 png 的图片引擎, 可选 phantom 或 magick. 如果选择 magick 引擎, 还需要安装 [image magick](https://imagemagick.org), 并保证 path 环境变量中有 `magick` 命令 | String | 默认值 phantom |
| image.name | 临时图片的文件名 | String | 默认值 tmp.png |
| replyFriend | 是否回复好友消息 | Boolean | 默认值 false |

最后, 运行 `npm start` 或 `node index.js` 启动机器人.

## cli

机器人的简单命令行界面

- `/ls`: 查看当前加入的所有群
- `/cd [index]`: 切换到第 index 个群, 如省略 index, 则显示当前的群
- `文字消息 \178`: 发送文字消息到当前的群. `\178` 代表滑稽的 qq 表情.
  [更多表情码在这里](https://github.com/kyubotics/coolq-http-api/wiki/%E8%A1%A8%E6%83%85-CQ-%E7%A0%81-ID-%E8%A1%A8)

## mirai-api-http 的使用

登录
```
POST /auth
{
  "authKey": "***"
}
```
认证
```
POST /verify
{
  "sessionKey": "***",
  "qq": ???
}
```
发消息
```
POST /sendGroupMessage
{
  "sessionKey": "***",
  "target": ???,
  "messageChain": [{
    "type": "Plain",
    "text": "本机器人不支持回复QQ表情喔~"
  }]
}
```
改名片
```
POST /memberInfo
{
  "sessionKey": "***",
  "target": ???,
  "memberId": ???,
  "info": {"name": "AsciiMath小助手"}
}
```

## FAQs

- 电脑端打 `/am` 会变成表情怎么办?

  解决方法1: 右键单击输入框, 关闭表情快捷键

  解决方法2: 使用 `/AM`

- 如何编写多行文字 / 公式?

  更新: `/am` 现在直接支持多行公式:
  ```
  /am
  "第一行"
  "第二行"
  ```
  可以用 `gather` 环境
  ```
  /tex
  \begin{gather}
  x^2 \\ y^2
  \end{gather}
  ```
  或者 `\displaylines`:
  ```
  /tex
  \displaylines{ x=a+b \\ y=b+c }
  ```
  或者用矩阵:
  ```
  /am
  {: "第一行"; "第二行" :}
  ```

## TODO

- 表情符宽度问题
- 根据指定宽度自动断行: 目前不支持. http://docs.mathjax.org/en/latest/output/linebreaks.html
