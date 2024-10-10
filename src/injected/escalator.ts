import { MtMessage } from "../schema/message.js"

window.addEventListener("message", (ev) => {
    if (ev.origin != "https://monkeytype.com" && ev.origin != "https://dev.monkeytype.com")
        return

    // blocks out SettingsUpdateMessage...
    let result = MtMessage.safeParse(ev.data)
    if (!result.success)
        return

    // TODO: use browser.tabs instead?
    // this should work fine though so idk
    browser.runtime.sendMessage(result.data)
})