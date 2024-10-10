import { sendMessage } from "../shared/api.js"

const leaderboardNameObserver = new MutationObserver((records) => {
    let before = records.find(e => e.removedNodes.length > 0)
        ?.addedNodes[0]
        .textContent 
    let after = records.find(e => e.addedNodes.length > 0)
        ?.addedNodes[0]
        .textContent 

    if (before != after)
        sendMessage("leaderboard", { leaderboard: after || null })
})

const leaderboardWrapperObserver = new MutationObserver((records) => {
    records.forEach((record) => {
        if (record.addedNodes.length > 0) {
            let leaderboardWrapper =
                Array.from(record.addedNodes)
                    .find(e => e instanceof HTMLElement && e.id == "leaderboardsWrapper") as HTMLDivElement
            
            if (leaderboardWrapper) {
                let mainTitle = leaderboardWrapper.getElementsByClassName("mainTitle")[0]
                sendMessage("leaderboard", { leaderboard: mainTitle.textContent })
                leaderboardNameObserver.observe(mainTitle, { childList: true })
            }
        }

        if (record.removedNodes.length > 0) {
            let leaderboardWrapper =
                Array.from(record.removedNodes)
                    .find(e => e instanceof HTMLElement && e.id == "leaderboardsWrapper") as HTMLDivElement
            
            if (leaderboardWrapper) {// clear leaderboard state, stop observing document
                sendMessage("leaderboard", { leaderboard: null })
                leaderboardNameObserver.disconnect()
                leaderboardWrapperObserver.disconnect()
            }
        }
    })
})

export default function listenForLeaderboardButtonClicks() {
    const popups = document.getElementById("popups")!
    const viewLeaderboards = (document.getElementsByClassName("view-leaderboards")[0] as HTMLButtonElement)

    viewLeaderboards.onclick = () =>
        leaderboardWrapperObserver.observe(popups, { childList: true })
}