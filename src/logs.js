// 重写 console.log
function wrap (name) {
  const log = console[name]
  console[name] = (...args) => {
    log(new Date().toLocaleString(), ...args)
  }
}
wrap('log')
wrap('error')
wrap('warn')
