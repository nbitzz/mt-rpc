import { MtMessage } from "../schema/message.js"
import { message, monkeytype } from "../schema/types.js"
import rpc from "../lib/rpc_api.js"

export interface Session {
    config: monkeytype.Configuration,
    stats: monkeytype.TestStats,
    timer: monkeytype.TimerStats,
    origin: number,
    instance: string,
    user: monkeytype.UserDbSnapshot | null,
    page: message.BrowseMessage["page"],
    leaderboard: string | null,
    tribe?: {
        version: string,
        state: monkeytype.TribeState,
        room: monkeytype.TribeRoom | null
    }
}

export let lastActivity: {fromSession: string, at: number} = {fromSession: "", at: 0}
export const sessions = new Map<string, Session>()
const subscribed: ((session: Session) => void)[] = []

function addSession(helloMessage: message.HelloMessage) {
    // hardcoded limit of 100 sessions
    if (sessions.size >= 100)
        sessions.delete(sessions.keys().next().value!)

    let newSession: Session = {
        leaderboard: null,
        user: null,//helloMessage.user
        config: helloMessage.configuration,
        stats: helloMessage.details,
        timer: helloMessage.timer,
        origin: helloMessage.origin,
        instance: helloMessage.instance,
        page: helloMessage.page,
        tribe: helloMessage.tribeVersion ? {
            version: helloMessage.tribeVersion,
            state: helloMessage.state!,
            room: helloMessage.room || null
        } : undefined
    }

    sessions.set(helloMessage.session, newSession)

    return newSession
}

browser.runtime.onMessage.addListener((message: message.Message) => {
    let result = MtMessage.safeParse(message)
    if (!result.success)
        return

    let session = sessions.get(result.data.session)

    if (session)
        switch(result.data.type) {
            case "config":
                session.config = result.data.configuration
            break
            case "test":
                session.stats = result.data.details
                session.timer = result.data.timer
            break
            case "tribe":
                if (!session.tribe) break
                if (result.data.state !== undefined) session.tribe.state = result.data.state
                if (result.data.room !== undefined) session.tribe.room = result.data.room
            break
            case "browse":
                session.page = result.data.page
            break
            case "leaderboard":
                session.leaderboard = result.data.leaderboard
            break
            case "account":
                session.user = result.data.user
            break
            case "destroy":
                sessions.delete(result.data.session)
                rpc.clearActivity() // idk
            return
        }
    else {
        if (result.data.type != "hello") return
        else session = addSession(result.data)
    }

    lastActivity.fromSession = result.data.session
    lastActivity.at = Date.now()
    
    subscribed.forEach(e => e(session))
})

export function subscribe(cb: (session: Session) => void) {
    subscribed.push(cb)
    return () => {
        subscribed.splice(subscribed.indexOf(cb), 1)
    }
}