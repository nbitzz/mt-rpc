import { message, monkeytype } from "../../schema/types.js"
import { MonkeytypeQuoteType, MonkeytypeTestType } from "../../schema/monkeytype.js"
import { Session } from "../state.js"
import * as solo from "./solo.js"
import * as tribe from "./tribe.js"
import { z } from "zod"
import { Gamemode } from "./types.js"

interface BaseUserState {
    icon: {
        image: string,
        text: string
    }
}

export interface UserIdle extends BaseUserState {
    type: "idle",
    on_page: message.BrowseMessage["page"] | "leaderboard" | "results"
}

export interface UserLookingAtLeaderboards extends UserIdle {
    on_page: "leaderboard"
    leaderboard: string
}

export interface UserLookingAtResults extends UserIdle {
    on_page: "results"
    speed: number
    acc: number    
}


export interface UserTyping extends BaseUserState {
    type: "typing"
    speed: number
    acc: number
    started: number
    ends?: number
}

export type UserState = UserIdle | UserLookingAtResults | UserLookingAtLeaderboards | UserTyping

export function getGamemode(session: Session) {
    // tribe updates the user's config
    //if (session.tribe && session.tribe.room) return tribe.getGamemode(session.tribe.room)
    /*else*/ return solo.getGamemode(session.config!)
}

export function getGamemodeName(gamemode: Gamemode) {
    switch(gamemode.gamemode) {
        case "time":
            return `Time ${gamemode.time}`
        case "words":
            return `Words ${gamemode.words}`
        case "quote":
            return `Quote ${gamemode.quoteTypes[0] == -2 ? "Specific" : gamemode.quoteTypes.map(e => MonkeytypeQuoteType[e]).join("/")}`
        case "zen":
            return "Zen"
        case "custom":
            return "Custom"
    }
}

export function getCurrentUserState(session: Session): UserState {
    const {stats, origin, leaderboard, tribe} = session
    const gamemode = getGamemode(session)
    const gamemodeName = getGamemodeName(gamemode)

    const page = session.page == "tribe" && tribe?.room ? "test" : session.page

    if (stats.start && !stats.end) {
        // User is typing
        const {wpmHistory, accuracy, start} = stats
        return {
            type: "typing",
            speed: wpmHistory.at(-1) ?? 0,
            acc: (accuracy.correct/(accuracy.correct+accuracy.incorrect))*100,
            started: origin+start,
            icon: {image: gamemode.gamemode, text: gamemodeName},
            ...(
                gamemode.gamemode == "time"
                ? {ends: origin+start+gamemode.time} 
                : {}
            )
        }
    } else {
        // User is idle. But doing what?
        if (stats.end) { // Just staring at results.
            const {wpmHistory, accuracy} = stats
            return {
                type: "idle",
                on_page: "results",
                icon: {image: "stats", text: gamemodeName},
                speed: wpmHistory.at(-1),
                acc: (accuracy.correct/(accuracy.correct+accuracy.incorrect))*100
            }
        }

        // Looking at leaderboards.
        if (leaderboard) {
            return {
                icon: {
                    image: "leaderboard",
                    text: `Looking at ${leaderboard}`
                },
                type: "idle",
                on_page: "leaderboard",
                leaderboard
            }
        }

        // Doing something else.
        return {
            type: "idle",
            on_page: page,
            icon: (() => {
                switch(page) {
                    case "tribe":
                        if (tribe) return {image: "tribe", text: "Looking for a Tribe room"}
                    case "account":
                        return {image: "stats", text: "Looking at account statistics"}
                    case "account-settings":
                        return {image: "settings", text: "Updating account settings"}
                    case "settings":
                        return {image: "settings", text: "Updating settings"}
                    case "profile":
                        return {image: "profile", text: `Looking at a public profile`}
                    default:
                        return {image: gamemode.gamemode, text: gamemodeName}
                }
            })()
        }
    }

}

export function getRpcIconUrl(config: monkeytype.Configuration, icon: string) {
    return `https://raw.githubusercontent.com/nbitzz/mt-rpc/refs/heads/main/rpc-icons/${config.customTheme ? "serika_dark" : config.theme}/${icon}.png`
}

export { default as getActivity } from "./get_activity.js"