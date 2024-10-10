import { HelloMessage } from "../../../schema/message.js"
import { sendMessage } from "../shared/api.js"
import { getPageName, interceptFunction } from "../shared/util.js"

export default function pushstate_shim() {
    history.pushState = interceptFunction(
        history.pushState.bind(history),
        () => {
            sendMessage("browse", {
                page: getPageName()
            })
            return {mode: "passthrough"}
        }
    )
}