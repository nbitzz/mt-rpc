import { monkeytype } from "../../schema/types.ts"

// Types for window.tribe, window.tribeState

declare global {
    interface Window {
        tribe: {
            expectedVersion: string
        }

        tribeState: {
            getRoom(): monkeytype.TribeRoom,
            getState(): monkeytype.TribeState,
            // i'm lazy
            setState(a: monkeytype.TribeState): unknown,
            setRoom(a: monkeytype.TribeRoom): unknown
        }
    }
}