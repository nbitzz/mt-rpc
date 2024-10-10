import { z } from "zod"
import { MonkeytypeConfiguration, MonkeytypeUserDbSnapshot, MonkeytypeTestStats, MonkeytypeTimerStats, MonkeytypeTribeRoom, MonkeytypeTribeState } from "./monkeytype.js"
import { Settings } from "./settings.js"
/*
export const CheckMessage = z.object({
    type: z.literal("check"),
    result: z.boolean()
}).describe("A message received when check.ts detects that a page is a Monkeytype page.")
*/
// I can't find a way to hook onto events for this, so this all of these
// are done through polling window.config, window.state(), and window.tribe functions

export const BaseMtMessage = z.object({
    session: z.string().uuid()
})

export const ConfigurationMessage = BaseMtMessage.extend({
    type: z.literal("config"),
    configuration: MonkeytypeConfiguration
}).describe("A message received when an update to the configuration has been detected.")

export const TestMessage = BaseMtMessage.extend({
    type: z.literal("test"),
    details: MonkeytypeTestStats,
    timer: MonkeytypeTimerStats
}).describe("A message received throughout a test containing test information.")

export const TribeMessage = BaseMtMessage.extend({
    type: z.literal("tribe"),
    state: z.nativeEnum(MonkeytypeTribeState).optional(),
    room: MonkeytypeTribeRoom.nullable().optional()
}).describe("A message containing the Tribe room's state.")

export const BrowseMessage = BaseMtMessage.extend({
    type: z.literal("browse"),
    page: z.enum(["test", "settings", "about", "account", "account-settings", "profile", "tribe"]).default("test")
}).describe("A message sent whenever the user goes to another page.")

export const LeaderboardMessage = BaseMtMessage.extend({
    type: z.literal("leaderboard"),
    leaderboard: z.string().nullable()
}).describe("A message sent whenever the user checks the leaderboards.")

export const AccountMessage = BaseMtMessage.extend({
    type: z.literal("account"),
    user: MonkeytypeUserDbSnapshot.nullable()
}).describe("A message sent when the user is logged in or logged out.")

export const DestroyMessage = BaseMtMessage.extend({
    type: z.literal("destroy")
}).describe("A message sent when a session is destroying.")

export const HelloMessage = BaseMtMessage.extend({
    type: z.literal("hello"),
    instance: z.string(),
    origin: z.number(),
    tribeVersion: z.string().optional()
}).merge(
    TribeMessage.omit({session:true, type: true}).partial()
).merge(
    TestMessage.omit({session:true, type: true})
).merge(
    ConfigurationMessage.omit({session:true, type: true})
).merge(
    BrowseMessage.omit({session:true, type: true})
)/*.merge(
    AccountMessage.omit({session:true, type: true})
)*/.describe("A message sent when a session is created.")

export const SettingsUpdateMessage = z.object({
    type: z.literal("settings_updated"),
    //localstate: z.nativeEnum(MonkeytypeTribeState),
    settings: Settings
}).describe("A message sent when settings are changed.")

export const Message = z.discriminatedUnion("type", [
    ConfigurationMessage,
    TestMessage,
    TribeMessage,
    DestroyMessage,
    HelloMessage,
    BrowseMessage,
    SettingsUpdateMessage,
    LeaderboardMessage,
    AccountMessage
])

export const MtMessage = z.discriminatedUnion("type", [
    ConfigurationMessage,
    TestMessage,
    TribeMessage,
    DestroyMessage,
    HelloMessage,
    BrowseMessage,
    LeaderboardMessage,
    AccountMessage
])
/*
export const ToMtMessage = z.discriminatedUnion("type", [
    FetchQuestMessage
])
*/