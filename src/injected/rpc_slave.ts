import RPCClient from "./rpc/index.js"

const rpcClient = new RPCClient()

rpcClient.addEventListener("ready", (ev) => {
    parent.postMessage({type: "ready", user: rpcClient.user }, "*")
})

rpcClient.addEventListener("disconnected", (ev) => {
    parent.postMessage({type: "disconnected"}, "*")
})

rpcClient.addEventListener("error", (ev) => {
    parent.postMessage({type: "disconnected"}, "*")
})

// no browser API, so we can't make sure that
// the extension is mt-rpc itself. oh well!
window.addEventListener("message", (activity) => {
    if (!activity.origin.startsWith("moz-extension://"))
        throw new Error(`attempt to access RPC from disallowed origin ${activity.origin}: ${JSON.stringify(activity.data)}`)

    switch(activity.data.type) {
        case "login":
            rpcClient.login({clientId: activity.data.clientId})
        case "set":
            rpcClient.setActivity(activity.data.activity)
        case "clear":
            rpcClient.clearActivity()
    }
})