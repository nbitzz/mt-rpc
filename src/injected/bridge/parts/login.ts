import { sendMessage } from "../shared/api.js"

export default function listenForLogins() {
    // this seems to always just be hidden
    // so we can detect when someone logs in
    // by observing for attrib changes
    const accountMenu = 
        document.getElementsByClassName("accountButtonAndMenu")[0]
        || document.getElementsByClassName("view-account")[0] // versions of mt without the account menu
    new MutationObserver(_ => 
        sendMessage("account", {
            user: window.snapshot() || null
        })
    ).observe(accountMenu, { attributes: true, attributeFilter: ["class"] })
}