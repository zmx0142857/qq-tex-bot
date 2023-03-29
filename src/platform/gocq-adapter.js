// Pack {
//   fromUser: 000,
//   fromGroup: 111,
//   rawMessage: '会了',
//   robot: 222,
//   isAt: false,
//   QQInfo: { card: '空一好', nickname: 'I could fran' },
//   success: true,
//   type: 'group'
// }
function getSender (data) {
  return {
    id: data.user_id,
    group: data.message_type === 'group' ? { id: data.group_id } : null,
    memberName: data.sender.card,
    name: data.sender.nickname,
  }
}

const CQTypes = {
  text: (obj) => ({
    type: 'Plain',
    text: obj.text,
  }),
  image: (obj) => ({
    type: 'Image',
    url: obj.url,
    path: obj.file,
  }),
  at: (obj) => ({
    type: 'At',
    target: obj.qq,
  }),
  reply: (obj) => ({
    ...obj,
    type: 'Quote',
  }),
  face: (obj) => ({
    type: 'Face',
    faceId: obj.id,
  }),
}

const MiraiTypes = {
  Plain: (obj) => ({
    type: 'text',
    data: {
      text: obj.text,
    }
  }),
  Image: (obj) => ({
    type: 'image',
    data: {
      url: obj.url,
      file: 'file://' + (obj.path[0] === '/' ? '' : '/') + obj.path.replace('\\', '/'),
    }
  }),
  At: (obj) => ({
    type: 'at',
    data: {
      qq: obj.target,
    }
  })
}

// get mirai message chain from CQ string
function getMessageChainFromRaw (rawMessage) {
  const placeholders = []
  const res = rawMessage.replace(/\[CQ:([^,]*),([^\]]*)\]/g, (match, $1, $2) => {
    // console.log(match, $1, $2)
    const obj = Object.fromEntries($2.split(',').map(entry => entry.split('=')))
    placeholders.push(CQTypes[$1] ? CQTypes[$1](obj) : { ...obj, type: $1 })
    return '[CQ:placeholder]'
  })
  const chain = []
  res.split('[CQ:placeholder]').forEach((text, index) => {
    if (text) chain.push({ type: 'Plain', text })
    const placeholder = placeholders[index]
    if (placeholder) chain.push(placeholder)
  })
  return chain
}

// get mirai message chain from CQ message array
//
// example 1. [ { type: 'text', data: { text: '不会，我是 raw 上报的' } } ]
//
// example 2. [
//   { type: 'reply', data: { id: '123456' } },
//   { type: 'at', data: { qq: '654321' } },
//   { type: 'text', data: { text: ' ' } },
//   { type: 'text', data: { text: '写个 adapter 把 gocq 的结构转为 mirai 的（' } }
// ]
//
// example 3. [
//   {
//     type: 'image',
//     data: {
//       file: '8abc0ab68efab206f4e74eeasdf87bac.image',
//       subType: '0',
//       url: 'https://gchat.qpic.cn/gchatpic_new/<groupId>/<uuid>/0?term=2&is_origin=0'
//     }
//   }
// ]
function getMessageChain (data) {
  const chain = data.message.map(msg => CQTypes[msg.type] ? CQTypes[msg.type](msg.data) : { ...msg.data, type: msg.type })
  chain.unshift({
    type: 'Source',
    id: data.message_id,
    time: data.time,
  })
  return chain
}

function fromMessageChain (chain) {
  if (typeof chain === 'string') {
    return chain
  } else if (Array.isArray(chain)) {
    return chain.map(msg => MiraiTypes[msg.type] ? MiraiTypes[msg.type](msg) : msg)
  } else {
    console.error('invalid message', chain)
  }
}

module.exports = {
  getSender,
  getMessageChain,
  getMessageChainFromRaw,
  fromMessageChain,
}
