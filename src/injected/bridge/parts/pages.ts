import { HelloMessage } from "../../../schema/message.js"
import { sendMessage } from "../shared/api.js"
import { getPageName, interceptFunction } from "../shared/util.js"

export default function pushstate_shim() {
    history.pushState = interceptFunction(
        history.pushState.bind(history),
        (_a, _b, url) => {
            sendMessage("browse", { page: getPageName(new URL(url || "", window.location.toString()).pathname) });
            return {mode: "passthrough"}
        }
    )
}