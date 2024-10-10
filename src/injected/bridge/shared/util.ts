import { HelloMessage } from "../../../schema/message.js"

export function convertObjectToShim<T extends Record<any, any>>(object: T, keys: { except: (keyof T)[] } | { only: (keyof T)[] }, cb: (key: keyof T, value: T[keyof T]) => void) {

    const realObject = JSON.parse(JSON.stringify(object))

    Object.defineProperties(
        object,
        Object.fromEntries(
            (
                "except" in keys
                ? Object.keys(object).filter(e => !keys.except.includes(e))
                : keys.only
            )
                .map(k => 
                    [
                        k, 
                        {
                            get() {
                                return realObject[k]
                            },
                            set(v) {
                                if (realObject[k] !== v) {
                                    let r = realObject[k] = v
                                    cb(k, v)
                                    return r
                                } else return v
                            }
                        }
                    ]
                )
            )
        )

    return realObject

}

export function interceptFunction<T extends (...a:any[]) => any>(func: T, cb: (...a: Parameters<T>) => { mode: "passthrough" } | { mode: "replace", value: ReturnType<T> } | { mode: "wrap", pass: Parameters<T> }) {
    return (...a:Parameters<T>) => {
        let ret = cb(...a)
        switch (ret.mode) {
            case "passthrough":
                return func(...a)
            case "replace":
                return ret.value
            case "wrap":
                return func(...ret.pass)
        }
    }
}

export function getPageName() {
    let split = window.location.pathname.replace(/^\/+/,"").split("/")[0]
    return HelloMessage.shape.page.safeParse(split).data || "test"
}