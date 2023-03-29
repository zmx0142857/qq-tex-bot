# qq-tex-bot

基于 [mathjax](http://mathjax.org) 的用于渲染数学公式 (和其它一些额外功能) 的 qq 机器人;
同时支持 [go-cqhttp](https://docs.go-cqhttp.org/) 和 [mirai](https://docs.mirai.mamoe.net/) 两种 bot 框架.

## 功能展示

支持的命令:

- `/am`: [asciimath](https://zmx0142857.gitee.io/note/#math/example/asciimath), 简易版本的公式标记语言
- `/tex`: tex 公式, 较复杂, 但功能更全
- `/rotate`: 旋转图片 (但自己发的图片除外). 妈妈再也不怕我得颈椎病了
- `/savepic`: 保存群聊图片, 化身弔图稽器人
- `/1a2b`: 老少皆宜的猜数字小游戏
- `/riddle`: 猜灯谜
- `/文案`: 文案生成器

管理员命令:
- `/remake`: 重新载入配置
- `/block <qq号>`: 临时拉黑某人, bot 下次启动时拉黑自动解除

<div>
<img src="img/S10509-115328.jpg" alt="图1" width="45%">
<img src="img/S10509-115344.jpg" alt="图2" width="45%">
</div>

## 快速上手

> go-cqhttp 和 mirai 选择一个安装即可. 推荐 go-cqhttp 因为它更稳定而且配置简单.

### 0. 安装 go-cqhttp

- [下载最新的 go-cqhttp](https://github.com/Mrs4s/go-cqhttp/releases).
- 初次运行 gocq 时选择正向 websocket 协议, gocq 会自动生成配置文件 `config.yml`.
- 打开配置文件, 填写
  - `account.uin`: bot 的 qq 号
  - `account.password`: bot 的密码
  - `message.post-format`: 上报类型, 从 string 改为 array.

具体配置可以参考本仓库的 `gocq/config.yml`.

<!--
我们的配置使用两个端口, `5700` 用于接收 bot 发出的消息并转发到 qq 群, `5701` 用于接收群聊消息并上报给 bot.
-->

### 1. 安装 mirai (可选)

mirai 是全平台、开源的 qq 机器人框架, 使用 java 和 kotlin 编写.  [官方用户手册](https://github.com/mamoe/mirai/blob/dev/docs/UserManual.md)

- 确保 java 版本至少是 11
- 新建目录 `mirai`, 下载 [mcl-installer](https://github.com/iTXTech/mcl-installer/releases) 或 [miral-console-loader](https://github.com/iTXTech/mirai-console-loader/releases), 然后运行

- 安装 mirai-api-http 插件, 用于提供 http 接口:
  ```shell
  ./mcl --update-package net.mamoe:mirai-api-http --type plugin --channel stable-v2
  ```
  打开配置文件 `config/net.mamoe.mirai-api-http/setting.yml`, 在 http 协议下增加一个 ws (https://github.com/Drincann/Mirai-js/issues/124):
  ```yaml
  adapters:
    - http
    - ws
  ...
  ```
<!--
- 安装[滑块验证模块](https://github.com/project-mirai/mirai-login-solver-selenium):
  ```shell
  ./mcl --update-package net.mamoe:mirai-login-solver-selenium --type plugin --channel nightly
  ```
-->
- 运行 `./mcl`, 一切正常的话, mirai-console 就会启动起来.
- 在 mirai-console 中输入 `/help` 查看帮助. 这时顺便配置一下 qq 的自动登录:
  ```shell
  /autoLogin add <account> <password> [passwordKind]    # 添加自动登录
  ```

#### Trouble Shooting

- mirai 各插件更新迭代很快, 启动 mcl 时容易出现版本不一致而报错的问题 (比如
  kotlin 的 no such method 之类).  解决方法是编辑 mirai 的 `config.json`,
  手动修改插件的 version, 然后尝试重启 `./mcl`.
  本仓库的 `mirai/config.json` 可以做一定的参考.
- 默认情况下 mirai 以 android 协议登录, 此时不允许再用 android
  手机登录同一个账号, 否则 mirai 会被强制下线.
  你可以在 `config/Console/AutoLogin.yml` 中切换协议.
- 如要将机器人部署到服务器, 建议先在自己电脑上登录 mirai console,
  并进行滑块验证.  成功以后关闭 mirai console,
  将 `bots/<qq号>/device.json` 文件拷贝到服务器. 这时服务器应该能顺利登录.

### 2. 安装 node js 依赖

假定已经安装最新版本的 node js. 在 qq-tex-bot 项目根目录 (`package.json` 所在的目录) 下运行

```shell
npm install
```

#### Trouble Shooting

- 安装过程如遇到 phantomjs 下载失败, 可以手动下载到指定的目录中:
  ```text
  Downloading https://github.com/Medium/phantomjs/releases/download/v2.1.1/phantomjs-2.1.1-windows.zip
  Saving to C:\Users\Administrator\AppData\Local\Temp\phantomjs\phantomjs-2.1.1-windows.zip
  Receiving...
  Error making request.
  Error: connect ETIMEDOUT *.*.*.*:443
      at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1148:16)
  ```
  比如上面这种情况, 只需到 https://github.com/Medium/phantomjs/releases/download/v2.1.1/phantomjs-2.1.1-windows.zip 下载文件, 保存到 C:\Users\Administrator\AppData\Local\Temp\phantomjs\phantomjs-2.1.1-windows.zip, 然后重新运行 `npm install` 即可.
- 如果始终无法装上 phantomjs, 也可以安装 [image magick](https://imagemagick.org), 并确保 `magick` 命令可用, 然后, 在 bot 的 `config.js` 中指定 `image.engine` 为 `magick` (见下节).

### 3. 配置你的 bot

在项目根目录下新建 `config.js`, 填写必要信息:

```js
module.exports = {
  // 如使用 go-cqhttp 框架, 需配置 gocq
  gocq: {
    ws: 'ws://0.0.0.0:8080/',
    qq: 123456, // 机器人的 qq 号
  },
  // 如使用 mirai, 需配置 server
  // server: {
  //   verifyKey: '', // mirai-api-http 2.x 提供的 verifyKey
  //   // authKey: '', // mirai-api-http 1.x 提供的 authKey
  //   qq: 123456, // 机器人的 qq 号
  // },
  groups: {
    112233: '群名称', // 群号和群名称
  },
  image: {
    // 图片目录绝对路径. 分隔符一律用斜杠 (/), 不要用反斜杠, 即使你是 windows
    path: '/path/to/gocq/data', // gocq
    // path: '/path/to/mirai', // mirai-api-http 2.x
    // path: '??/mirai/data/net.mamoe.mirai-api-http/images', // mirai-api-http 1.x
  },
  auth: {
    admin: [123124123], // 你的 qq 号
    blackList: [], // 黑名单
    // whiteList: [], // 白名单
    // blackGroup: [], // 群聊黑名单
    // whiteGroup: [], // 群聊白名单
  },
  // 启用的插件
  // math 和 savepic 在各个群都能使用
  // 1a2b, riddle, copywriting, mma 只在 whiteGroup 指定的群中可用
  plugins: {
    math: {},
    savepic: {
      saveGroup: []
    },
    '1a2b': {
      whiteGroup: [],
    },
    riddle: {
      whiteGroup: [],
    },
    copywriting: {
      whiteGroup: [],
    },
    mma: {
      // 配置了 whiteGroup 后，该群成员都可使用，不限于 admin。
      // 如要只允许 admin 使用，请去掉 whiteGroup
      // whiteList: config.auth.admin,
      whiteGroup: [],
      whiteList: [],
    }
  },
}
```

|参数|解释|类型|是否必填|
|----|----|----|----|
| gocq.ws | gocq 服务地址 | String | 默认值 ws://0.0.0.0:8080/ |
| gocq.qq | 机器人的 qq 号 | Number | <span style="color:red">使用 gocq 时必填</span> |
| server.baseUrl | mirai 服务地址 | String | 默认值 http://localhost:8080 |
| server.verifyKey | mirai-api-http 提供的 verifyKey, 请妥善保存, 不要泄露 | String | <span style="color:red">使用 mirai 时必填</span> |
| server.qq | 机器人的 qq 号 | Number | <span style="color:red">使用 mirai 时必填</span> |
| groups | 机器人加入的群, 以 `群号: 群名` 的格式填写, 可填多个 | Object | <span style="color:red">必填</span> |
| image.path | mirai 图片目录的绝对路径. 分隔符一律用斜杠 (/), 不要用反斜杠, 即使你是 windows | String | <span style="color:red">必填</span> |
| image.engine | svg 转 png 的图片引擎, 可选 phantom 或 magick. 如果选择 magick 引擎, 还需要安装 [image magick](https://imagemagick.org), 并保证 path 环境变量中有 `magick` 命令 | String | 默认值 phantom |
| image.name | 临时图片的文件名 | String | 默认值 tmp.png |
| replyFriend | 是否回复好友消息 | Boolean | 默认值 false |
| auth.admin | 管理员们的 qq 号 | Number[] | 默认为空 |
| auth.blackList | 黑名单 | Number[] | 默认为空 |
| auth.whiteList | 白名单 | Number[] | 默认为空 |
| auth.blackGroup | 群聊黑名单 | Number[] | 默认为空 |
| auth.whiteGroup | 群聊白名单 | Number[] | 默认为空 |
| plugins | 开启的插件 | Object | <span style="color:red">必填</span> |
| plugins.math.display | 公式是否为 displayStyle | Boolean | 默认值 true |
| plugins.math.ex | 公式的字体大小 | Number | 默认值 16 |

最后, 运行 `npm start` 或 `node index.js` 启动机器人.

## cli

机器人的简单命令行界面. 当你运行 `npm start` 后就自动进入命令模式了, 有以下指令可用:

- `/ls`: 查看当前加入的所有群
- `/cd [index]`: 切换到第 index 个群, 如省略 index, 则显示当前的群
- `文字消息 \178`: 发送文字消息到当前的群. `\178` 代表滑稽的 qq 表情.
  [更多表情码在这里](https://github.com/kyubotics/coolq-http-api/wiki/%E8%A1%A8%E6%83%85-CQ-%E7%A0%81-ID-%E8%A1%A8)
- `/quit <群号>`: 退群.

<!--
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
-->

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
