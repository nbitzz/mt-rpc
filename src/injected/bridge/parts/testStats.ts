/// <reference path="../monkeytype.d.ts" />

import { monkeytype } from "../../../schema/types.js";
import { sendMessage } from "../shared/api.js";

let primaryPoll: ReturnType<typeof setInterval> | undefined
let secondaryPoll: ReturnType<typeof setTimeout> | undefined

function clearPolls() {
    if (primaryPoll)
        clearInterval(primaryPoll)
    if (secondaryPoll)
        clearInterval(secondaryPoll)
}

let lastStats: monkeytype.TestStats = window.stats()

/**
 * @description Starts polling for test begin
 */
export default function startPrimaryPoll() {
    clearPolls();
    primaryPoll = setInterval(() => {
        let stats = window.stats()
        // i'm lazy. if this breaks too bad!
        if (lastStats.start != stats.start) {
            lastStats = stats
            sendMessage("test", {
                details: stats,
                timer: []
            })
        }
        if (stats.start && !stats.end)
            runSecondaryPoll()
    }, 250)
}

function runSecondaryPoll() {
    clearPolls();
    let stats = window.stats()
    let timerStats = window.getTimerStats()
    lastStats = stats
    sendMessage("test", {
        details: stats,
        timer: timerStats
    })

    // end polling if the test has ended
    if (!(stats.start && !stats.end))
        return startPrimaryPoll()

    // schedule next poll
    setTimeout(
        () => runSecondaryPoll(),
        timerStats[timerStats.length-1].nextDelay + 100
    )
}