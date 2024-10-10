import { MonkeytypeQuoteType } from "../../schema/monkeytype.js";
import { monkeytype } from "../../schema/types.js";
import { Gamemode } from "./types.js";


export function getGamemode(config: monkeytype.Configuration): Gamemode {
    switch(config.mode) {
        case "time":
            return {
                gamemode: "time",
                time: config.time
            }
        case "words":
            return {
                gamemode: "words",
                words: config.words
            }
        case "quote":
            return {
                gamemode: "quote",
                quoteTypes: config.quoteLength
            }
        case "zen":
            return {
                gamemode: "zen"
            }
        case "custom":
            return {
                gamemode: "custom"
            }
    }
}