import { sendMessage } from "../shared/api.js"
import { convertObjectToShim } from "../shared/util.js"
/// <reference path="../monkeytype.d.ts" />

export default function config_shim() {
    const configuration = convertObjectToShim(
        window.config,
        {except: []},
        () => sendMessage("config", {
            configuration
        })
    )
}