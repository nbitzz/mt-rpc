import { monkeytype } from "../../../schema/types.js"
import { sendMessage } from "../shared/api.js"
import { interceptFunction, convertObjectToShim } from "../shared/util.js"

export function tribeShim() {
    let realRoom: monkeytype.TribeRoom | undefined

    window.tribeState.setState = interceptFunction(
        window.tribeState.setState.bind(window.tribeState),
        (newState) => {
            sendMessage("tribe", {
                state: newState
            })
            return {mode:"passthrough"}
        }
    )

    window.tribeState.setRoom = interceptFunction(
        window.tribeState.setRoom.bind(window.tribeState),
        (room) => {
            // tribe room left
            if (!room) sendMessage("tribe", { room: null })

            // tribe actually updates window.config
            // so we don't need this. yay!
            /*
            // 1. convert the configuration to a shim
            convertObjectToShim(
                room.config,
                { except: [] },
                () => sendTribeMessage(realRoom)
            )
            */

            // 2. then, convert the room to a shim
            realRoom = convertObjectToShim(
                room,
                { except: ["config"] },
                () => sendMessage("tribe", {
                    room: realRoom
                })
            )

            // then announce
            sendMessage("tribe", {
                room: realRoom
            })

            return {mode:"passthrough"}
        }
    )
}

export default function tribeShimIfTribe() {
    if (window.tribe) tribeShim()
}