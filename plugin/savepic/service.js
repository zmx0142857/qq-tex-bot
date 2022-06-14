const request = require('request')
const fs = require('fs')
const path = require('path')
const config = require('../../config')

const extReg = /\.jpg$|\.jpeg$|\.png|\.gif$/i
const moduleName = 'savepic'
const picDir = path.join(config.image.path, moduleName)

function mkdir (dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

module.exports = {
  cache: {},
  // 初始化图片文件名缓存
  async init (groupId) {
    try {
      const dir = path.join(picDir, groupId)
      mkdir(dir)
      let files = await fs.promises.readdir(dir)
      files = files.filter(fileName => extReg.test(fileName))
      this.cache[groupId] = files
      return files
    } catch (e) {
      console.error(e)
    }
  },
  // 随机选择一个文件
  async choose (groupId) {
    try {
      const files = this.cache[groupId] || await this.init(groupId)
      if (files.length > 0) {
        const res = files[Math.random() * files.length | 0]
        console.log(files)
        return res
      }
    } catch (e) {
      console.error(e)
    }
  },
  // 判断文件存在性
  async has (groupId, fileName) {
    try {
      const files = this.cache[groupId] || await this.init(groupId)
      return files.includes(fileName)
    } catch (e) {
      console.error(e)
    }
  },
  // 新增文件
  async add (groupId, fileName, url) {
    try {
      const files = this.cache[groupId] || await this.init(groupId)
      if (files.includes(fileName)) {
        return { code: -1, msg: '图片已存在，请重新命名' }
      }
      files.push(fileName)
      const filePath = path.join(picDir, groupId, fileName)
      request(url).pipe(fs.createWriteStream(filePath))
      return { code: 0, msg: '已保存 ' + fileName }
    } catch (e) {
      console.error(e)
    }
  },
  // 返回图片对象
  image (groupId, fileName) {
    return {
      type: 'Image',
      path: path.join(moduleName, groupId, fileName),
    }
  },
}
