const math = require('./src/plugin/math/index.js')
const am = math[2].method
am('汉字\n1 + √1').then(console.log)
