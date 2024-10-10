import {z, ZodNativeEnum} from "zod"
import * as MessageSchemas from "./message.js"
import * as MonkeytypeSchemas from "./monkeytype.js"
import { Settings } from "./settings.js"

export namespace message {
    export type Message = z.infer<typeof MessageSchemas.Message>
    export type MtMessage = z.infer<typeof MessageSchemas.MtMessage>
    //export type CheckMessage = z.infer<typeof MessageSchemas.CheckMessage>
    export type ConfigurationMessage = z.infer<typeof MessageSchemas.ConfigurationMessage>
    export type TestMessage = z.infer<typeof MessageSchemas.TestMessage>
    export type TribeMessage = z.infer<typeof MessageSchemas.TribeMessage>
    export type DestroyMessage = z.infer<typeof MessageSchemas.DestroyMessage>
    export type HelloMessage = z.infer<typeof MessageSchemas.HelloMessage>
    export type BrowseMessage = z.infer<typeof MessageSchemas.BrowseMessage>
    export type LeaderboardMessage = z.infer<typeof MessageSchemas.LeaderboardMessage>
    export type AccountMessage = z.infer<typeof MessageSchemas.AccountMessage>
    export type SettingsUpdateMessage = z.infer<typeof MessageSchemas.SettingsUpdateMessage>

    export type MessageOfType<name extends Message["type"]> = (
        {
            [x in Message["type"]]: 
                Message & {type: x}
        }
    )[name]
}

export namespace monkeytype {
    export type Configuration = z.infer<typeof MonkeytypeSchemas.MonkeytypeConfiguration>
    export type TestStats = z.infer<typeof MonkeytypeSchemas.MonkeytypeTestStats>
    export type TimerStats = z.infer<typeof MonkeytypeSchemas.MonkeytypeTimerStats>
    export type TribeRoom = z.infer<typeof MonkeytypeSchemas.MonkeytypeTribeRoom>
    export type UserDbSnapshot = z.infer<typeof MonkeytypeSchemas.MonkeytypeUserDbSnapshot>
    export type TribeState = typeof MonkeytypeSchemas.MonkeytypeTribeState[keyof typeof MonkeytypeSchemas.MonkeytypeTribeState]
}