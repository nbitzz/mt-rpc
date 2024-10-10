import { MonkeytypeQuoteType } from "../../schema/monkeytype.js";
import { monkeytype } from "../../schema/types.js";
import { Gamemode } from "./types.js";

export function getGamemode(room: monkeytype.TribeRoom): Gamemode {
    switch(room.config.mode) {
        case "time":
            return {
                gamemode: "time",
                time: room.config.mode2
            }
        case "words":
            return {
                gamemode: "words",
                words: room.config.mode2
            }
        case "quote":
            return {
                gamemode: "quote",
                quoteTypes: room.config.mode2
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