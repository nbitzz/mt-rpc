import type RPCClient from "./index.js";

const pack = JSON.stringify.bind(JSON);
const unpack = JSON.parse.bind(JSON);

export class RPCMessage extends Event {
    data: any
    constructor(data: string) {
        super("message")
        this.data = unpack(data)
    }
}

export default class WebSocketTransport extends EventTarget {
    client: RPCClient
    ws?: WebSocket = undefined
    tries: number = 0

    constructor(client: RPCClient) {
        super();
        this.client = client;
    }

    async connect() {
        const port = 6463 + (this.tries % 10);
        console.log(`trying to connect to port ${port} clientid ${this.client.clientId}`)
        this.tries += 1;

        this.ws = new WebSocket(`ws://127.0.0.1:${port}/?v=1&client_id=${this.client.clientId}&encoding=json`);
        this.ws.addEventListener("open", this.onOpen.bind(this));
        this.ws.addEventListener("close", this.onClose.bind(this));
        this.ws.addEventListener("error", this.onError.bind(this));
        this.ws.addEventListener("message", this.onMessage.bind(this));
    }

    onOpen(event: Event) {
        console.log("open")
        this.dispatchEvent(new Event("open"));
    }

    onClose(event: CloseEvent) {
        console.log("close")
        console.log("closed", event.wasClean, event.reason)
        /*if (!event.wasClean) {
            return;
        }*/
        this.dispatchEvent(new Event("close"));
    }

    onError(event:Event) {
        console.log("error")
        try {
            this.ws?.close();
        } catch {}

        if (this.tries > 20) {
            this.dispatchEvent(new Event("error", event));
        } else {
            setTimeout(() => {
                this.connect();
            }, 250);
        }
    }

    onMessage(event: MessageEvent<any>) {
        this.dispatchEvent(new RPCMessage(event.data));
    }

    send(data: any) {
        this.ws!.send(pack(data));
    }

    ping() {}

    close() {
        return new Promise((r) => {
            this.addEventListener('close', r, {once: true});
            this.ws?.close();
        });
    }
}