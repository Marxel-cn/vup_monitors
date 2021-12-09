const { ws, http } = require('./bot')
const onCommand = require('./command_listener')
const messager = require('./el/api/message-source')

async function executeCommands(data) {
  try {
    await onCommand({ data, ws, http })
  } catch (err) {
    console.warn(`执行指令时出现错误: ${err?.message}`)
    console.error(err)
  }
}

const { owners } = require('./el/data-storer').settings
console.log(`已设置管理员QQ号: ${owners}, 群管和管理员都可使用指令。`)

// 同时启动 Redis 和 WS 监控
console.log('正在启动 vup monitors...')
Promise.all([ws.startWS(), messager.connect()])
  .then(() => {
    ws.listen(data => {
      if (process.env.NODE_ENV === 'development') {
        console.log(data)
      }
      executeCommands(data)
    })
  })
  .catch(console.error)