// Maybe I should find some way to clean this up later
import { ActivityType } from "discord-api-types/v10"
import { settings } from "../config.js"
import { Presence } from "../rpc_api.js"
import { getCurrentUserState, getGamemodeName, UserTyping, UserLookingAtResults, UserLookingAtLeaderboards, getRpcIconUrl, getGamemode} from "./index.js"
import { Session } from "../state.js"

export default function getActivity(session: Session) {
    const currentUserState = getCurrentUserState(session)
    const currentGamemode = getGamemode(session)
    const gamemodeName = getGamemodeName(currentGamemode)

    const buttons = [
        ...(
            settings.rpc.profileLink
            && session.user
            ? [
                {
                    label: "View profile",
                    url: `https://${session.instance}/profile/${session.user.name}`
                }
            ]
            : []
        ),
        ...(
            session.tribe // does the session have tribe?
            && session.tribe.room // is the user in a room?
            && settings.tribe.allowJoin // does the user want people to join?
            // does the user want this button even if their room is private?
            && ( !session.tribe.room.isPrivate /* if public, return true */ || settings.tribe.allowPrivateJoin )
            ? [
                {
                    label: "Join Tribe room",
                    url: `https://${session.instance}/tribe/${session.tribe.room.id}`
                }
            ]
            : []
        )
    ]

    return {
        type: ActivityType.Playing,

        details:
            currentUserState.type == "typing"
            ? `Typing ${session.tribe && session.tribe.room ? `in ${session.tribe.room.name}` : ""}`
            : (() => {
                switch(currentUserState.on_page) {
                    case "results":
                        return "Looking at test results"
                    case "account":
                        return `Looking at account statistics`
                    case "account-settings":
                        return `Updating account settings`
                    case "settings":
                        return `Updating settings`
                    case "tribe":
                        if (session.tribe) return `Looking for a Tribe lobby`
                    case "profile":
                        return `Viewing someone's profile`
                    case "leaderboard":
                        return "Checking the leaderboards"
                    default:
                        return session.tribe && session.tribe.room
                            ? `In lobby of ${session.tribe.room.name}`
                            : `Idle`
                }
            })(),
        
        ...(() => {
            switch (currentUserState.type == "typing" ? "typing" : currentUserState.on_page) {
                case "results":
                case "typing":
                    return { 
                        state: `${(currentUserState as UserTyping|UserLookingAtResults).speed}wpm, ${(currentUserState as UserTyping|UserLookingAtResults).acc.toFixed()}% acc`,
                    }
                case "leaderboard":
                    return {
                        state: (currentUserState as UserLookingAtLeaderboards).leaderboard
                    }
                default:
                    return {}
            }
        })(),
        
        ...(
            currentUserState.type == "typing"
            ? {
                timestamps: {
                    start: currentUserState.started,
                    // i think discord got rid of the ability to time remaining with the rpc update
                    //end: currentUserState.ends
                }
            }
            : {}
        ),
        
        assets: {
            ...(
                session.tribe && session.tribe.room
                ? {
                    large_image: getRpcIconUrl(session.config, "tribe"),
                    large_text: `In ${session.tribe.room.name}`
                }
                : {
                    large_image: getRpcIconUrl(session.config, "monkeytype"),
                    large_text: "Monkeytype"
                }
            ),
            small_image: getRpcIconUrl(session.config, currentUserState.icon.image),
            small_text: currentUserState.icon.text
        },

        ...(
            buttons.length > 0
            ? { buttons }
            : {}
        )

    } satisfies Presence
}