import { MtMessage } from "../schema/message.js"

let mySession: string | undefined = undefined

window.addEventListener("message", (ev) => {
    if (ev.origin != "https://monkeytype.com" && ev.origin != "https://dev.monkeytype.com")
        return

    let result = MtMessage.safeParse(ev.data)
    if (!result.success)
        return

    if (!mySession) mySession = result.data.session

    browser.runtime.sendMessage(result.data)
})