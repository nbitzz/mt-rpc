import { z } from "zod"

export enum MonkeytypeQuoteType {
    Short,
    Medium,
    Long,
    Thicc
}

export const MonkeytypeSelectedQuoteTypes = z.union([
    z.array(z.nativeEnum(MonkeytypeQuoteType)),
    z.tuple([z.literal(-2)]).describe("Custom quote")
])

export const MonkeytypeTestType = z.enum([
    "time",
    "words",
    "quote",
    "zen",
    "custom"
])

export const BaseMonkeytypeCustomText = z.object({
    text: z.array(z.string()),   
})

export const MonkeytypeCustomText = z.union([
    BaseMonkeytypeCustomText.extend({
        isTimeRandom: z.literal(false),
        isWordRandom: z.literal(false),
    }),
    BaseMonkeytypeCustomText.extend({
        isTimeRandom: z.literal(true),
        isWordRandom: z.literal(false),
        time: z.number()
    }),
    BaseMonkeytypeCustomText.extend({
        isTimeRandom: z.literal(false),
        isWordRandom: z.literal(true),
        word: z.number()
    }),
])

// these schemas only include variables we actually care about

export const MonkeytypeConfiguration =
    z.object({
        time: z.number(),
        words: z.number(),
        quoteLength: MonkeytypeSelectedQuoteTypes,
        mode: MonkeytypeTestType,
        theme: z.string(),
        customTheme: z.boolean()
    })

export const MonkeytypeTestStats =
    z.object({
        start: z.number().default(0),
        end: z.number().default(0),
        accuracy: z.object({correct: z.number(), incorrect: z.number()}),
        //afkHistory: z.array(z.boolean()),
        wpmHistory: z.array(z.number()),
    })

export const MonkeytypeTimerStats =
    z.array(z.object({
        dateNow: z.number(),
        expected: z.number(),
        nextDelay: z.number(),
        now: z.number()
    }))

export const MonkeytypeUserDbSnapshot =
    z.object({
        name: z.string()
        // maybe add pb? idk
    })

// https://github.com/monkeytypegame/monkeytype/blob/newtribemerge/frontend/src/ts/tribe/tribe.ts

export const MonkeytypeTribeState = {
    Error: -1,
    Connected: 1,
    InLobby: 5,
    PreparingRace: 10,
    RaceCountdown: 11,
    RaceActive: 12,
    OneFinished: 20,
    AllFinished: 21, // waiting for everyone to ready up after the race is over
    TimerOver: 22 // The timer is over, but we haven't returned to lobby yet
} as const

export const MonkeytypeTribeRoomConfig =
    z.discriminatedUnion("mode", [
        z.object({
            mode: z.literal("time"),
            mode2: z.number()
        }),
        z.object({
            mode: z.literal("words"),
            mode2: z.number()
        }),
        z.object({
            mode: z.literal("quote"),
            mode2: MonkeytypeSelectedQuoteTypes
        }),
        z.object({
            mode: z.literal("zen"),
            mode2: z.literal("zen")
        }),
        z.object({
            mode: z.literal("custom"),
            mode2: z.literal("custom"),
            customText: MonkeytypeCustomText,
        })
    ])

export const MonkeytypeTribeRoom =
    z.object({
        id: z.string(),
        type: z.string(), // no idea what this is...
        isPrivate: z.boolean(),
        size: z.number(),
        name: z.string(),
        state: z.nativeEnum(MonkeytypeTribeState),
        config: MonkeytypeTribeRoomConfig,
    })