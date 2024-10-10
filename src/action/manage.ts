import { ZodBoolean, ZodDefault, ZodNumber, ZodString } from "zod"
import type { WindowAdditions } from "../index.js"
import { RPCCommunicator } from "../lib/rpc_api.js"
import { Settings } from "../schema/settings.js"
import { save, settings } from "../lib/config.js"

// Replace version
document.getElementsByName("version")[0].textContent = browser.runtime.getManifest().version

const backgroundPage = browser.extension.getBackgroundPage() as Window & WindowAdditions

/* rpc */ {
    /* reset RPC slave button */ { 
        const button = document.getElementById("resetRPCSlave") as HTMLButtonElement

        button.addEventListener("click", () => {
            button.disabled = true
            button.textContent = "wait..."
            backgroundPage.resetAndLogin()
                .then(() => {
                    button.disabled = false
                    button.textContent = "reconnect"
                })
                .catch(_ => {
                    button.textContent = "error!"
                    console.error(_)
                })
        })
    }
    /* RPC status */ {
        const { rpc } = backgroundPage
        const rpcStateElement = document.getElementsByName("rpcState")[0] as HTMLSlotElement
        const rpcUserInfoElement = document.getElementsByName("userInfo")[0] as HTMLSlotElement

        const updateRpcElements = () => {
            if (rpc.usable) {
                rpcStateElement.innerHTML = "connected to"
                rpcUserInfoElement.textContent = `Hi, @${rpc.user?.username}`
            } else {
                rpcStateElement.innerHTML = '<span style="color:var(--error-color)">disconnected</span> from'
                rpcUserInfoElement.textContent = ""
            }
        }

        rpc.addEventListener("ready", updateRpcElements)
        rpc.addEventListener("disconnected", updateRpcElements)
        updateRpcElements()
    }
}

/* theme */ (async() => {
    const { state: { lastActivity: { fromSession }, sessions } } = backgroundPage
    const session = sessions.get(fromSession)
    const sheet = document.styleSheets[0]
    const theme: {name: string, css: string} = (await browser.storage.local.get("theme")).theme as any | undefined;

    let themeCss = ""
    // todo: support custom themes. also this bad
    if (session && !session.config.customTheme) {
        if (theme && session && session.config.theme == theme.name) {
            themeCss = theme.css
        } else if (session) {
            themeCss = await (await fetch(`https://monkeytype.com/themes/${session.config.theme}.css`)).text()
            browser.storage.local.set({
                theme: {
                    name: session.config.theme,
                    css: themeCss
                }
            })
        }
    } else if (theme) {
        themeCss = theme.css
    }
    
    sheet.insertRule(themeCss, sheet.cssRules.length)
})()

/* configuration */ {
    /* settings */ {
        const Factories = {
            string(setting: ZodString, currentValue: string, onChange: (newValue: string) => void) {
                let input = document.createElement("input")
                input.placeholder = setting.description!
                input.value = currentValue
                input.addEventListener("change", () => onChange(input.value))
                return input
            },
            number(setting: ZodNumber, currentValue: string, onChange: (newValue: number) => void) {
                let input = document.createElement("input")
                input.type = "number"
                input.placeholder = setting.description!
                input.value = currentValue
                input.addEventListener("change", () => onChange(parseFloat(input.value)))
                if (setting.minValue !== undefined && setting.minValue !== null) input.min = setting.minValue.toString()
                if (setting.maxValue !== undefined && setting.maxValue !== null) input.max = setting.maxValue.toString()
                return input
            },
            boolean(setting: ZodBoolean, currentValue: boolean, onChange: (newValue: boolean) => void) {
                let buttonContainer = document.createElement("div");
                buttonContainer.className = "btnFlex";
                ["off", "on"].forEach((v, i) => {
                    // setup button
                    let button = document.createElement("button");
                    button.textContent = v
                    button.style.width = "5em";
                    if (Boolean(i) === currentValue) button.className = "active"

                    // actual click evt
                    button.addEventListener("click", () => {
                        if (button.className != "active") {
                            button.className = "active"
                            buttonContainer.children.item((i + 1) % 2)!.className = ""
                            onChange(Boolean(i))
                        }
                    })
                    
                    buttonContainer.appendChild(button)
                })
                return buttonContainer
            },
            unknown(setting: any, currentValue: any, onChange: any) {
                const oops = document.createElement("p")
                oops.textContent = "No factory for setting type"
                return oops
            }
        } as const satisfies Record<string, (setting: any, currentValue: any, onChange: (newValue: any) => void) => HTMLElement>

        const contain = document.getElementsByName("configure")[0] as HTMLSlotElement

        contain.append(
            ...Object.entries(Settings.shape)
                .map(([categoryName, category]) => {
                    const categoryElm = document.createElement("div");
                    const categoryTitle = document.createElement("h3");
                    categoryTitle.textContent = category.description || categoryName
                    categoryElm.append(
                        categoryTitle,
                        ...Object.entries(category.removeDefault().shape)
                            .map(([settingKey, setting]: [string, ZodDefault<ZodBoolean | ZodString | ZodNumber>]) => {
                                const settingContainer = document.createElement("div")
                                settingContainer.className = "split"
                                
                                // label
                                const settingLabelContainer = document.createElement("div")
                                let _splitName = (setting.description || "?").split(":")
                                const title = _splitName.splice(0,1)[0]
                                const desc = _splitName.join(":")
                                const settingLabel = document.createElement("p")
                                settingLabel.textContent = title
                                settingLabelContainer.appendChild(settingLabel)

                                if (desc) {
                                    const settingDesc = document.createElement("p")
                                    settingDesc.textContent = desc
                                    settingLabelContainer.appendChild(settingDesc)
                                }

                                // option
                                settingContainer.append(
                                    settingLabelContainer,
                                    //@ts-ignore I'm too lazy for this shit
                                    Factories[(() => {
                                        let dfr = setting.removeDefault()
                                        if (dfr instanceof ZodString)
                                            return "string"
                                        else if (dfr instanceof ZodBoolean)
                                            return "boolean"
                                        else if (dfr instanceof ZodNumber)
                                            return "number"
                                        else
                                            return "unknown"
                                    })()](
                                        setting,
                                        //@ts-ignore and I don't want to write some giant `as` statement
                                        settings[categoryName][settingKey],
                                        (newValue: any) => {
                                            //@ts-ignore leave me alone!!!
                                            settings[categoryName][settingKey] = newValue;
                                            save()
                                        }
                                    )
                                )

                                return settingContainer
                            })
                    )
                    
                    return categoryElm
                })
        )
    }
    /* danger zone */ {
        /* reset */ {
            const button = document.getElementById("reset") as HTMLButtonElement
            button.addEventListener("click", () => {
                button.disabled = true
                button.textContent = "wait..."
                browser.storage.local.clear()
                    .then(() => {
                        button.disabled = false
                        button.textContent = "clear"
                    })
                    .catch(_ => {
                        button.textContent = "error!"
                        console.error(_)
                    })
            })
        }
    }
}