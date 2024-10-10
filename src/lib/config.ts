import { z } from "zod";
import { Settings } from "../schema/settings.js";
import { message } from "../schema/types.js";
import { SettingsUpdateMessage } from "../schema/message.js";

export let settings: z.infer<typeof Settings> = Settings.safeParse({}).data!

async function load() {
    let parsed = Settings.safeParse(
        (await browser.storage.local.get("settings") || { settings: {} })
            .settings
    )
    
    if (parsed.success)
        Object.assign(settings, parsed.data)
}

export async function save() {
    let parsed = Settings.safeParse(settings)
    if (!parsed.success)
        throw parsed.error
    else {
        await browser.storage.local.set({
            settings: parsed.data
        })
        browser.runtime.sendMessage({ type: "settings_updated", settings: parsed.data } satisfies message.SettingsUpdateMessage)
    }
}

browser.runtime.onMessage.addListener((message) => {
    let result = SettingsUpdateMessage.safeParse(message)
    if (!result.success)
        return

    Object.assign(settings, result.data.settings)
})

await load()