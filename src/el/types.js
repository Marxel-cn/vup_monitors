const { update, read } = require('./data-storer')
const utils = require('./utils')

class CommandExecutor {

    constructor() {
        if (this.constructor === CommandExecutor) {
            throw new Error('not implemented')
        }
    }

    async execute({ send, data }, args) {
        throw new Error('not implemented')
    }

}

class MessageSource {

    constructor() {
        this.subscribing = new Set()
    }

    async connectInternal() {
        throw new Error("not implemented")
    }

    async listenInternal(room) {
        throw new Error("not implemented")
    }

    async unlistenInternal(room) {
        throw new Error("not implemented")
    }

    async listenAll(rooms){
        if (rooms.length == 0) return
        for (const room of rooms) {
            await this.listen(room, false)
        }
    }

    async unlisten(room) {
        if (!this.subscribing.has(room)) return false
        await this.unlistenInternal(room)
        this.subscribing.delete(room)
        await update(data => {
            data.blive.subscribing = [...this.subscribing]
        })
        return true
    }

    async listen(room, update_storage = true) {
        if (this.subscribing.has(room)) return false
        await this.listenInternal(room)
        this.subscribing.add(room)
        if (update_storage) {
            await update(data => {
                data.blive.subscribing = [...this.subscribing]
            })
        }
        return true
    }

    async connect(){
        await this.connectInternal()
        const length = await this.fetchSubscribing()
        console.log(`已从离线数据重新监控 ${length} 个直播间`)
    }

    listening() {
        return new Set(this.subscribing)
    }

    async fetchSubscribing() {
        const data = await read()
        const blive = data['blive']
        const rooms = blive.subscribing ?? []
        try {
            this.subscribing = new Set(rooms)
            await this.listenAll(rooms)
        } catch (err) {
            console.warn(`从离线新增订阅时出现错误: ${err}, 五秒后重试`)
            await utils.sleep(5000)
            return await this.fetchSubscribing()
        }
        return rooms.length
    }

}

module.exports = {
    CommandExecutor,
    MessageSource
}

