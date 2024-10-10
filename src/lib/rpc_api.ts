import { APIUser, GatewayActivity } from "discord-api-types/v10"
// Allow discord.com to load in an iframe

export type Presence = Omit<GatewayActivity, "id"|"name"|"created_at">

const Discord: HTMLIFrameElement = document.getElementById("discord") as HTMLIFrameElement
const Discord_frameId = browser.runtime.getFrameId(Discord)

browser.webRequest.onHeadersReceived.addListener((det) => {
    // make sure that this request is actually from rpc-slave's iframe
    if (!(
        det.tabId == -1 
        && det.frameId == Discord_frameId
        && det.documentUrl == window.location.toString()
        && det.parentFrameId == 0
    ))
        return

    let responseHeaders = det.responseHeaders || []

    {
        let replace = responseHeaders.findIndex(e => e.name.toLowerCase() == "x-frame-options")
        if (replace > -1)
            responseHeaders.splice(replace, 1)
    }

    return {
        responseHeaders
    }
}, {urls: ["https://discord.com/humans.txt?__MT_RPC"]}, ["responseHeaders", "blocking"]);

type RPCSlaveMessage =
    {type: "ready", user: APIUser}
    | {type: "disconnected"}

export class RPCCommunicator extends EventTarget {

    lastActivity: Presence | undefined = undefined
    user: APIUser | undefined = undefined
    usable: boolean = false

    constructor() {
        super()
        window.addEventListener("message", e => this.onRpcSlaveMessage(e.data))
    }

    private onRpcSlaveMessage(e: RPCSlaveMessage) {
        switch(e.type) {
            case "ready":
                this.usable = true
                this.user = e.user
                this.dispatchEvent(new Event("ready"))
                if (this.lastActivity) this.setActivity(this.lastActivity)
            break
            case "disconnected":
                this.usable = false
                this.dispatchEvent(new Event("disconnected"))
            break
        }
    }

    login(clientId: string) {
        return new Promise<APIUser>((res, rej) => {
            Discord.contentWindow!.postMessage({
                type: "login",
                clientId
            },"*")

            let disconnect = () => { rej(); this.removeEventListener("disconnected", disconnect) }
            let connect = () => { res(this.user!); this.removeEventListener("disconnected", disconnect) }
            
            this.addEventListener("ready", connect, {once: true})
            this.addEventListener("disconnected", disconnect, {once: true})
        })
    }
    
    setActivity(activity: Presence) {
        if (!this.usable) return;
        
        this.lastActivity = activity
        Discord.contentWindow!.postMessage({
            type: "set",
            activity
        },"*")
    }

    clearActivity() {
        if (!this.usable) return;

        this.lastActivity = undefined
        Discord.contentWindow!.postMessage({
            type: "clear"
        },"*")
    }

    reset() {
        this.usable = false
        this.dispatchEvent(new Event("disconnected"))
        return new Promise<void>((res, rej) => {
            let fail = () => { rej(); this.removeEventListener("load", load) }
            let load = () => { res(); this.removeEventListener("error", fail) }
            
            Discord.addEventListener(
                "load",
                load,
                {once: true}
            )

            Discord.addEventListener(
                "error",
                fail,
                {once: true}
            )

            Discord.src = "https://discord.com/humans.txt?__MT_RPC"
        })
    }
}

const RPCCommunicatorSingleton =
    new RPCCommunicator()

export default RPCCommunicatorSingleton