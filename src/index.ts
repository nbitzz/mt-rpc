/// <reference types="vite/client" />
import rpc, { Presence, RPCCommunicator } from "./lib/rpc_api.js";
import { message } from "./schema/types.js";
import { lastActivity, subscribe, sessions } from "./lib/state.js";
import { ActivityType, APIUser, GatewayActivity } from "discord-api-types/v10";
import { getActivity, getCurrentUserState, getGamemode, getGamemodeName, getRpcIconUrl, UserLookingAtLeaderboards, UserLookingAtResults, UserTyping } from "./lib/util/index.js";
import { settings } from "./lib/config.js";
import { z } from "zod";
import { Settings } from "./schema/settings.js";

export interface WindowAdditions {
    rpc: RPCCommunicator
    resetAndLogin: () => Promise<APIUser>
    settings: z.infer<typeof Settings>
    state: {
        lastActivity: typeof lastActivity
        subscribe: typeof subscribe
        sessions: typeof sessions
    }
}

declare var window: Window & WindowAdditions

let clearTimer: ReturnType<typeof setTimeout> | undefined;
let lastTypingEvt = 0

subscribe((session) => {
    const userState = getCurrentUserState(session)
    const activity = getActivity(session)

    // clear activity when idle for >10m
    clearTimeout(clearTimer)
    if (settings.rpc.hideWhenInactive)
        clearTimer = setTimeout(() => rpc.clearActivity(), 10*60*1000)
    
    // don't bother sending something if we don't
    // even have wpmhist yet
    // TODO: check - if we go over the ratelimit,
    //       does it send activities slower?
    if (
        userState.type == "typing"
        && (
            !(
                !settings.rpc.requireWpm // if requireWPM is false, skip return
                || session.stats.wpmHistory.length > 0
            )
            || Date.now() < lastTypingEvt+(settings.rpc.typingUpdate*1000)
        )
    ) {
        return
    }
    else lastTypingEvt = Date.now()

    rpc.setActivity(activity)
})

// this is bad, lol
// but i just want to finish this

function resetAndLogin() {
    return rpc.reset().then(_ =>
        rpc.login(settings.rpc.appId)
    )
}

function updateBadge() {
    if (rpc.usable) {
        if (settings.mtrpc.connectedBadge) {
            browser.browserAction.setBadgeBackgroundColor({color: "#00FF00"})
            browser.browserAction.setBadgeText({text: "\u2713"})
        } else browser.browserAction.setBadgeText({text: null})
    } else {
        if (settings.mtrpc.disconnectedBadge) {
            browser.browserAction.setBadgeBackgroundColor({color: "#FF0000"})
            browser.browserAction.setBadgeText({text: "!"})
        } else browser.browserAction.setBadgeText({text: null})
    }
}

Object.assign(window, {
    rpc,
    resetAndLogin,
    settings,
    state: {
        lastActivity,
        subscribe,
        sessions
    }
})

resetAndLogin()
    .catch(_ => console.error(_))

rpc.addEventListener("disconnected", updateBadge)
rpc.addEventListener("ready", updateBadge)
updateBadge()