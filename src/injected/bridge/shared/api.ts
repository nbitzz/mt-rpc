import { message } from "../../../schema/types.js";

export const session = crypto.randomUUID();

export function sendMessage<T extends message.MtMessage["type"]>(type: T, props: Omit<message.MessageOfType<T>, "session"|"type">) {
    window.postMessage({
        session,
        type,
        ...props
    }, "*")
}