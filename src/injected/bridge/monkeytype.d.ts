import { monkeytype } from "../../schema/types.ts"

// Types for window.config, window.stats, window.getTimerStats
declare global {
    interface Window {
        stats(): monkeytype.TestStats
        getTimerStats(): monkeytype.TimerStats
        snapshot(): monkeytype.UserDbSnapshot | undefined
        config: monkeytype.Configuration
    }
}