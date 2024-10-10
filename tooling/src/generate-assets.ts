// This is stupid but I don't care enough to fix it
import { createCanvas, loadImage } from "canvas"
import { Buffer } from "node:buffer"
import { writeFile, mkdir, rm } from "node:fs/promises"

type ThemeColor = "bgColor"|"mainColor"|"subColor"|"textColor"

async function render(ic: typeof REQUIRED_ICONS[keyof typeof REQUIRED_ICONS], colors: Record<ThemeColor, string>) {
    // search and replace
    const raw_svg = Object.entries(ic.rep).reduce((prev, cur) => prev.replace(cur[1], colors[cur[0] as ThemeColor]), ic.asset)
    // load image/
    const img = await loadImage(`data:image/svg+xml;base64,${Buffer.from(raw_svg).toString("base64")}`)
    // create canvas
    const canvas = createCanvas(...(ic.size == "large" ? [256,256] : [64,64]) as [number, number])
    const ctx = canvas.getContext("2d")

    const ratio = img.height / img.width
    const newWidth = canvas.width/2
    const newHeight = newWidth*ratio

    // background
    ctx.fillStyle = colors.bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // image
    ctx.drawImage(img, canvas.width/4, (canvas.height-newHeight)/2, newWidth, newHeight);

    return canvas.createPNGStream()
}

console.log("downloading required icons")

const REQUIRED_ICONS = Object.fromEntries(await Promise.all(
    Object.entries({
        monkeytype: {
            size: "large",
            // i actually genuinely have 0 idea where they put
            // the svg logo officially, so we're settling for this shit
            url: "https://raw.githubusercontent.com/monkeytype-hub/monkeytype-icon/refs/heads/master/monkeytype-icon/logo-svg/serika_dark.svg",
            add: [],
            rep: { mainColor: /\#e2b714/g }
        },
        tribe: {
            size: "large",
            url: "https://site-assets.fontawesome.com/releases/v6.6.0/svgs/solid/satellite.svg",
            add: [{ after: "svg", value: ' fill="mainColor"' }],
            rep: { mainColor: /mainColor/g }
        },
        time: {
            size: "small",
            url: "https://site-assets.fontawesome.com/releases/v6.6.0/svgs/solid/clock.svg",
            add: [{ after: "svg", value: ' fill="mainColor"' }],
            rep: { mainColor: /mainColor/g }
        },
        words: {
            size: "small",
            url: "https://site-assets.fontawesome.com/releases/v6.6.0/svgs/solid/font.svg",
            add: [{ after: "svg", value: ' fill="mainColor"' }],
            rep: { mainColor: /mainColor/g }
        },
        quote: {
            size: "small",
            url: "https://site-assets.fontawesome.com/releases/v6.6.0/svgs/solid/quote-right.svg",
            add: [{ after: "svg", value: ' fill="mainColor"' }],
            rep: { mainColor: /mainColor/g }
        },
        zen: {
            size: "small",
            url: "https://site-assets.fontawesome.com/releases/v6.6.0/svgs/solid/mountain.svg",
            add: [{ after: "svg", value: ' fill="mainColor"' }],
            rep: { mainColor: /mainColor/g }
        },
        custom: {
            size: "small",
            url: "https://site-assets.fontawesome.com/releases/v6.6.0/svgs/solid/wrench.svg",
            add: [{ after: "svg", value: ' fill="mainColor"' }],
            rep: { mainColor: /mainColor/g }
        },
        profile: {
            size: "small",
            url: "https://site-assets.fontawesome.com/releases/v6.6.0/svgs/solid/user.svg",
            add: [{ after: "svg", value: ' fill="mainColor"' }],
            rep: { mainColor: /mainColor/g }
        },
        stats: {
            size: "small",
            url: "https://site-assets.fontawesome.com/releases/v6.6.0/svgs/solid/chart-line.svg",
            add: [{ after: "svg", value: ' fill="mainColor"' }],
            rep: { mainColor: /mainColor/g }
        },
        settings: {
            size: "small",
            url: "https://site-assets.fontawesome.com/releases/v6.6.0/svgs/solid/gear.svg",
            add: [{ after: "svg", value: ' fill="mainColor"' }],
            rep: { mainColor: /mainColor/g }
        },
        leaderboard: {
            size: "small",
            url: "https://site-assets.fontawesome.com/releases/v6.6.0/svgs/solid/crown.svg",
            add: [{ after: "svg", value: ' fill="mainColor"' }],
            rep: { mainColor: /mainColor/g }
        }
    } satisfies Record<string, {size: "small"|"large", url: string, rep:Partial<Record<ThemeColor, RegExp>>, add:{after:string, value:string}[]}>)
        .map(async ([key, value]) => [
            key,
            {
                size: value.size,
                rep: value.rep,
                asset: value.add.reduce(
                    (acc, cur) => 
                        acc.replace(cur.after, cur.after+cur.value),
                    (await (await fetch(value.url)).text())
                )
            }
        ])
)) as Record<string, {size: "small"|"large", asset: string, rep: Partial<Record<ThemeColor, RegExp>>}>

console.info("downloading theme list")
let themes: Record<'name'|ThemeColor, string>[] = 
    await (await fetch("https://raw.githubusercontent.com/monkeytypegame/monkeytype/refs/heads/master/frontend/static/themes/_list.json")).json()

console.info("removing assets dir")
await rm("./rpc-icons", {recursive: true, force: true})

for (const theme of themes) {
    await mkdir(`./rpc-icons/${theme.name}`, {recursive: true})
    for (const [name, icon] of Object.entries(REQUIRED_ICONS)) {
        console.info(`rendering ${theme.name}/${name}`)
        await writeFile(`./rpc-icons/${theme.name}/${name}.png`, await render(icon, theme))
    }
}