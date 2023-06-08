const request = require('request')
const fs = require('fs')
const path = require('path')
const config = require('../../config')
const message = require('../../message')

const extReg = /\.jpg$|\.jpeg$|\.png$|\.gif$/i
const moduleName = 'savepic'
const picDir = () => path.join(config.image.path, moduleName)

function mkdir (dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

module.exports = {
  cache: {},
  reload () {
    this.cache = {}
  },
  // 初始化图片文件名缓存
  async init (groupId) {
    if (this.cache[groupId]) return this.cache[groupId]
    try {
      const dir = path.join(picDir(), groupId)
      mkdir(dir)
      let files = await fs.promises.readdir(dir)
      files = files.filter(fileName => extReg.test(fileName))
      this.cache[groupId] = files
      return files
    } catch (e) {
      console.error(e)
      return [message.error]
    }
  },
  // 随机选择一个文件
  async choose (groupId, keyword) {
    try {
      let files = await this.init(groupId)
      if (keyword) {
        files = files.filter(filename =>
          filename.toLowerCase().includes(keyword.toLowerCase())
        )
      }
      if (files.length > 0) {
        return files[Math.random() * files.length | 0]
      }
    } catch (e) {
      console.error(e)
      return [message.error]
    }
  },
  // 判断文件存在性
  async has (groupId, fileName) {
    try {
      const files = await this.init(groupId)
      return files.includes(fileName)
    } catch (e) {
      console.error(e)
      return [message.error]
    }
  },
  async rename (groupId, fileName, newGroupId, newFileName) {
    try {
      const files = await this.init(groupId)
      const newFiles = await this.init(newGroupId)
      const index = files.indexOf(fileName)
      if (index === -1) {
        return { code: -1, msg: '重命名失败，没有找到图片' }
      }
      if (newFiles.includes(newFileName)) {
        return { code: -1, msg: '重命名失败，新名称已被使用' }
      }
      files.splice(index, 1)
      newFiles.push(newFileName)

      const filePath = path.join(picDir(), groupId, fileName)
      const newFilePath = path.join(picDir(), newGroupId, newFileName)
      await fs.promises.rename(filePath, newFilePath)
      return { code: 0, msg: '已重新命名 ' + newFileName }
    } catch (e) {
      console.error(e)
      return { code: -1, msg: '出错了 qwq' }
    }
  },
  // 新增文件
  async add (groupId, fileName, url) {
    try {
      const files = await this.init(groupId)
      if (files.includes(fileName)) {
        return { code: -1, msg: '图片已存在，请重新命名' }
      }
      files.push(fileName)
      const filePath = path.join(picDir(), groupId, fileName)
      request(url).pipe(fs.createWriteStream(filePath))
      return { code: 0, msg: '已保存 ' + fileName }
    } catch (e) {
      console.error(e)
      return { code: -1, msg: '出错了 qwq' }
    }
  },
  // 删除文件
  async delete (groupId, fileName) {
    try {
      const files = await this.init(groupId)
      const index = files.indexOf(fileName)
      if (index === -1) {
        return { code: -1, msg: '图片不存在' }
      }
      files.splice(index, 1)
      const filePath = path.join(picDir(), groupId, fileName)
      await fs.promises.rename(filePath, filePath + '.del')
      return { code: 0, msg: '已删除 ' + fileName }
    } catch (e) {
      console.error(e)
      return { code: -1, msg: '出错了 qwq' }
    }
  },
  // 返回图片对象
  image (groupId, fileName) {
    return {
      type: 'Image',
      path: path.join(config.image.path, moduleName, groupId, fileName),
    }
  },
}
