import { z } from "zod";

export const Settings =
    z.object({
        rpc: z.object({
            appId: z.string().regex(/[0-9]/).default("1292563981629657118").describe("Discord client ID: ID of the application you would like to use for Rich Presence."),
            profileLink: z.boolean().default(true).describe("Link to profile: Adds a button to your presence allowing others to view your Monkeytype profile if logged in."),
            typingUpdate: z.number().min(0).max(15).default(3.75).describe("Typing stats ratelimit: Refuse to update live typing statistics if it's been less than X seconds since the last update."),
            requireWpm: z.boolean().default(true).describe("Require WPM history: Refuse to update live typing statistics if the test has no WPM history (the first second of a test)."),
            hideWhenInactive: z.boolean().default(true).describe("Hide after inactivity: Clears rich presence if there has been no activity on a Monkeytype session for >10 minutes.")
        }).default({}).describe("presence"),
        tribe: z.object({
            allowJoin: z.boolean().default(true).describe("Allow joins: Allow others to join your Tribe room from your Discord profile."),
            allowPrivateJoin: z.boolean().default(false).describe("Disregard room privacy: Allow others to join every Tribe room you are in, regardless of whether it is public or private."),
        }).default({}).describe("tribe"),
        mtrpc: z.object({
            connectedBadge: z.boolean().default(false).describe("Show badge when connected: Shows a badge when you are connected to Discord."),
            disconnectedBadge: z.boolean().default(true).describe("Show badge when disconnected: Shows a badge when you are disconnected from Discord."),/*
            useRpcSlave: z.boolean().default(true).describe("Use discord.com origin: Whether or not to connect to the RPC websocket with an origin of discord.com. Toggle if you have connection issues; turn on if you use arRPC.")
            */
        }).default({}).describe("mt-rpc")
    })