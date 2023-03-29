const WebSocket = require('ws')

const TAG = '[gocq-ws]'

function parseJson (str, defaultValue = {}) {
  try {
    return JSON.parse(str) || defaultValue
  } catch (err) {
    return defaultValue
  }
}

function initWs ({ url = 'ws://0.0.0.0:8080/', onMessage = console.log, encoding = 'utf-8' }) {
  const ws = new WebSocket(url)
  ws.on('open', () => {
    console.log(TAG, 'opened', url)
    ws.on('message', data => onMessage(parseJson(String(data, encoding))))
    ws.on('error', console.error)
    ws.on('close', (code, reason) => {
      console.log(TAG, 'closed', code, reason)
    })
    ws.on('unexpectedResponse', ({ req, res }) => {
      console.error(TAG, 'unexpected response', req, res)
    })
  })
  return Promise.resolve(ws)
}

module.exports = initWs
