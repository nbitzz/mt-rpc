/// <reference path="./monkeytype.d.ts" />
/// <reference path="./tribe.d.ts" />

import { sendMessage } from "./shared/api.js";
import { getPageName } from "./shared/util.js";
console.log("Hello from mt-rpc!")
window.addEventListener("beforeunload", () => sendMessage("destroy", {}))

const parts = import.meta.glob("./parts/*")

let loop = setInterval(() => {
    if (window.stats && window.config) {
        console.log("Starting...")

        sendMessage("hello", {
            instance: window.location.hostname,
            origin: performance.timing.navigationStart || performance.timeOrigin,
            
            details: window.stats(),
            timer: window.getTimerStats(),
            
            configuration: JSON.parse(JSON.stringify(window.config)),
    
            //user: window.snapshot() || null,
    
            page: getPageName(),
            
            ...(window.tribe ? {
                tribeVersion: window.tribe.expectedVersion,
                state: window.tribeState.getState(),
                room: window.tribeState.getRoom()
            } : {})
        })

        clearInterval(loop)
        
        Object.entries(parts)
            .forEach(([partName, part]) => {
                console.log(`loading part ${partName}`);
                (part() as Promise<{default: () => void|Promise<void>}>).then(async ({default: def}) => {
                    await def()
                    console.log(`part ${partName} initialized`)
                })
            })
    }
}, 250)