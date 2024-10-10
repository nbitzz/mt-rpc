import RPCClient from "./rpc/index.js"

const rpcClient = new RPCClient()

rpcClient.addEventListener("ready", (ev) => {
    parent.postMessage({type: "ready", user: rpcClient.user },"*")

    window.addEventListener("message", (activity) => {
        if (activity.data.type == "set")
            rpcClient.setActivity(activity.data.activity)
        if (activity.data.type == "clear")
            rpcClient.clearActivity()
    })
})

rpcClient.addEventListener("disconnected", (ev) => {
    parent.postMessage({type: "disconnected"},"*")
})

rpcClient.addEventListener("error", (ev) => {
    parent.postMessage({type: "disconnected"},"*")
})

window.addEventListener("message", (event) => {
    if (event.data.type == "login")
        rpcClient.login({clientId: event.data.clientId})
})