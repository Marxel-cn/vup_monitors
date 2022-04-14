const WebSocket = require('ws')
const { websocket } = require('../data-storer').settings
const utils = require('../utils')
const { default: axios } = require('axios')
const FormData = require('form-data')

const { MessageSource } = require('../types')
const { handleMessage } = require('../message-handler');

const IDENTIFIER = 'vup_monitors'

class WebSocketSouce extends MessageSource {


    constructor(){
        super()
        this.websocketURL = `ws${websocket['use-tls'] ? 's' : ''}://${websocket.host}/ws?id=${IDENTIFIER}`
        const baseURL = `http${websocket['use-tls'] ? 's' : ''}://${websocket.host}/subscribe`
        this.api = axios.create({
            baseURL,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': IDENTIFIER
            }
        })
    }

    async connectInternal(){
        try {
            this.client = await initWebSocket(this.websocketURL)
            console.log(`已成功连接到 Biligo WebSocket 服务器`)
            this.client.on('message', handleMessage)
            this.client.on('error', err => {
                console.warn(`Biligo WebSocket 出現錯誤: ${err}, 重新連線中...`)
                this.connect()
            })
            this.client.on('close', () => {
                console.warn(`Biligo WebSocket 意外關閉, 重新連線中...`)
                this.connect()
            })
        }catch(err){
            console.warn(`連接到 Biligo WebSocket 服务器時出現錯誤: ${err?.message ?? err}, 五秒後重連...`)
            await utils.sleep(5000)
            await this.connectInternal()
        }
    }

    async listenInternal(room){
        const form = new FormData()
        form.append('subscribes', room)
        try {
            await this.api.put('/add', form, { headers: form.getHeaders() })
        }catch(err){
            throw new Error(err?.response?.data?.error ?? err?.response?.data ?? err)
        }
    }


    async unlistenInternal(room){
        const form = new FormData()
        form.append('subscribes', room)
        try {
            await this.api.put('/remove', form, { headers: form.getHeaders() })
        }catch(err){
            throw new Error(err?.response?.data?.error ?? err?.response?.data ?? err)
        }
    }

    async listenAll(rooms){
        if (rooms.length == 0) return
        const form = new FormData()
        for (const room of rooms){
            form.append('subscribes', room)
        }
        try {
            // 透過調用 ?validate=false 來略過房間訊息檢查以防止412請求頻繁
            await this.api.post('?validate=false', form, { headers: form.getHeaders() })
        }catch(err){
            throw new Error(err?.response?.data?.error ?? err?.response?.data ?? err)
        }
    }

    async getRoomUserName(room){
        const res = await this.api.get(`/listening/${room}`)
        return res.data
    }

}

async function initWebSocket(url){
    return new Promise((res, rej) => {
        const client = new WebSocket(url,)
        client.on('open', () => res(client))
        client.on('error', rej)
    })
}


module.exports = {
    'websocket': WebSocketSouce
}