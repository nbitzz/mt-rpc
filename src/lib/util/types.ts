import { z } from "zod";
import { MonkeytypeSelectedQuoteTypes } from "../../schema/monkeytype.js";

export type Gamemode = 
    { gamemode: "time", time: number }
    | { gamemode: "words", words: number }
    | { gamemode: "quote", quoteTypes: z.infer<typeof MonkeytypeSelectedQuoteTypes> }
    | { gamemode: "zen" }
    | { gamemode: "custom" }