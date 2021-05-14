# qq-tex-bot

使用 [mirai](https://github.com/mamoe/mirai), [mirai-js](https://github.com/Drincann/Mirai-js) 和 [mathjax](http://mathjax.org) 实现的用于渲染数学公式的 qq 机器人.

## 功能展示

目前支持的命令:

- `/tex`: tex 公式, 较复杂, 但功能更全;
- `/am`: [asciimath](https://zmx0142857.gitee.io/note/#math/example/asciimath), 简易版本的公式标记语言.

## 快速上手

### 1. 安装 mirai

mirai 是全平台、开源的 qq 机器人框架, 使用 java 和 kotlin 编写.  [官方用户手册](https://github.com/mamoe/mirai/blob/dev/docs/UserManual.md)

- 新建目录 `mirai`, 下载 mcl-installer: https://github.com/iTXTech/mcl-installer/releases
- 运行 `./mcl-installer`, 再运行 `./mcl`, 一切正常的话, mirai-console
  就会启动起来.
- 此时在控制台登录会失败, 因为还未安装滑块验证模块: https://github.com/project-mirai/mirai-login-solver-selenium/releases
- 安装 mirai-api-http 插件:
  ```shell
  ./mcl --update-package net.mamoe:mirai-api-http --type plugin --channel stable
  ```

> 默认情况下 mirai 以 android 协议登录, 此时不允许再用 android
> 手机登录同一个账号, 否则 mirai 会被强制下线.

### 2. 安装 node js 依赖

假定已经安装最新版本的 node.js, 在项目根目录 (`package.json` 所在的目录) 下运行

```shell
npm install
```

在项目根目录下新建 `config.js`, 填写必要信息:

```js
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
```

> 如果选择 magick 引擎, 还需要安装 [image magick](https://magick.org), 并保证 path 环境变量中有 `magick` 命令.

启动机器人:

```shell
node index.js
```

## mirai-api-http 使用

登录
```
http post /auth '{"authKey":"***"}'
```
认证
```
http post /verify '{"sessionKey":"***","qq":2071245907}'
```
发消息
```
http post /sendGroupMessage '{"sessionKey":"***","target":726542042,"messageChain":[{"type":"Plain","text":"本机器人不支持QQ表情喔~"}]}'
```

## FAQs

- 如何编写多行文字 / 公式?

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
