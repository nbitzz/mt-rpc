import WebSocketTransport, { type RPCMessage } from "./websocket.js";
import { RPCCommands, RPCEvents, RelationshipTypes } from "./constants.js";
import { GatewayActivity, APIUser } from "discord-api-types/v10"

const uuid = crypto.randomUUID.bind(crypto)

/**
 * @typedef {RPCClientOptions}
 * @extends {ClientOptions}
 * @prop {string} transport RPC transport. one of `ipc` or `websocket`
 */

interface RPCLoginOptions {
    clientId: string,
    clientSecret?: string,
    accessToken?: string,
    rpcToken?: string,
    tokenEndpoint?: string,
    scopes?: string[],
    redirectUri?: string,
    prompt?: string // ???
}

interface RPCClientOptions {
  tokenEndpoint?: string,
  scopes?: string[],
}

/**
 * The main hub for interacting with Discord RPC
 * @extends {BaseClient}
 */
export default class RPCClient extends EventTarget {
  /**
   * @param {RPCClientOptions} [options] Options for the client.
   * You must provide a transport
   */
  options: RPCClientOptions
  accessToken: string | null = null
  clientId: string | null = null
  application: string | null = null
  user: APIUser | null = null
  fakePid: string = Math.random().toString().slice(2,7)

  fetchEndpoint = "https://discord.com/api";

  private transport: WebSocketTransport
  private _expecting = new Map<ReturnType<typeof uuid>, {resolve: (_: any) => void, reject: (_: any) => void}>()
  _connectPromise: Promise<RPCClient> | undefined;
  
  constructor(options?: RPCClientOptions) {
    super();

    this.options = options || {};
    this.transport = new WebSocketTransport(this)
    this.transport.addEventListener("message", (evt) => this._onRpcMessage((evt as RPCMessage).data));
  }

  fetch: ((method: string, path: string, _: {data?: BodyInit, query?:URLSearchParams}) => any) = (method, path, { data, query } = {}) =>
    fetch(
      `${this.fetchEndpoint}${path}${
        query ? new URLSearchParams(query) : ""
      }`,
      {
        method,
        body: data,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    ).then(async (r) => {
      const body = await r.json();
      if (!r.ok) {
        const e = new Error(r.statusText);
        throw e;
      }
      return body;
    });

  /**
   * Search and connect to RPC
   */
  connect(clientId: string) {
    console.log("connecting")
    if (this._connectPromise) {
      return this._connectPromise;
    }
    this._connectPromise = new Promise((resolve, reject) => {
      this.clientId = clientId;
      const timeout = setTimeout(
        () => reject(new Error("RPC_CONNECTION_TIMEOUT")),
        10e5
      );
      
      this.addEventListener("connected", () => {
        console.log("Connected")
        clearTimeout(timeout);
        resolve(this);
      }, {once: true});

      this.transport.addEventListener("close", (ev) => {
        console.log(ev)
        this._expecting.forEach((e) => {
          e.reject(new Error("connection closed"));
        });
        this.dispatchEvent(new Event("disconnected"));
        reject(new Error("connection closed"));
      });
      
      console.log("telling transport to connect")
      this.transport.connect().catch(reject);
    });
    return this._connectPromise;
  }

  /**
   * Performs authentication flow. Automatically calls Client#connect if needed.
   * @param {RPCLoginOptions} options Options for authentication.
   * At least one property must be provided to perform login.
   * @example client.login({ clientId: '1234567', clientSecret: 'abcdef123' });
   * @returns {Promise<RPCClient>}
   */
  async login(options:RPCLoginOptions) {
    let { clientId, accessToken } = options;
    await this.connect(clientId);
    console.log("Continuing logging in")

    if (!options.scopes) {
      this.dispatchEvent(new Event("ready"));
      return this;
    }

    if (!accessToken)
      accessToken = await this.authorize(options);

    return this.authenticate(accessToken!);
  }

  /**
   * Request
   * @param {string} cmd Command
   * @param {Object} [args={}] Arguments
   * @param {string} [evt] Event
   * @returns {Promise}
   * @private
   */
  request(cmd: keyof typeof RPCCommands, args: any, evt?: string) {
    return new Promise<any>((resolve, reject) => {
      const nonce = uuid();
      this.transport.send({ cmd, args, evt, nonce });
      this._expecting.set(nonce, { resolve, reject });
    });
  }

  /**
   * Message handler
   * @param {Object} message message
   * @private
   */
  _onRpcMessage(message: any) {
    if (
      message.cmd === RPCCommands.DISPATCH &&
      message.evt === RPCEvents.READY
    ) {
      console.log("Ready")
      if (message.data.user) {
        this.user = message.data.user;
      }
      this.dispatchEvent(new Event("connected"));
    } else if (this._expecting.has(message.nonce)) {
      const { resolve, reject } = this._expecting.get(message.nonce)!;
      if (message.evt === "ERROR") {
        const e = new Error(`${message.data.code}: ${message.data.message}`);
        reject(e);
      } else {
        resolve(message.data);
      }
      this._expecting.delete(message.nonce);
    } else {
      this.dispatchEvent(new Event(message.evt, message.data));
    }
  }

  /**
   * Authorize
   * @param {Object} options options
   * @returns {Promise}
   * @private
   */
  async authorize(loginOptions: RPCLoginOptions) {
    let {
        scopes,
        clientId,
        clientSecret,
        rpcToken,
        redirectUri,
        prompt,
      } = loginOptions
    if (Boolean(clientSecret && rpcToken) === true) {
      const body = await this.fetch("POST", "/oauth2/token/rpc", {
        data: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret!,
        }),
      });
      rpcToken = body.rpc_token;
    }

    const { code } = await this.request(RPCCommands.AUTHORIZE, {
      scopes,
      client_id: clientId,
      prompt,
      rpc_token: rpcToken,
    });

    const response = await this.fetch("POST", "/oauth2/token", {
      data: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret!,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri || "",
      }),
    });

    return response.access_token;
  }

  /**
   * Authenticate
   * @param accessToken access token
   */
  authenticate(accessToken: string) {
    return this.request(RPCCommands.AUTHENTICATE, { access_token: accessToken }).then(
      ({ application, user }) => {
        this.accessToken = accessToken;
        this.application = application;
        this.user = user;
        this.dispatchEvent(new Event("ready"));
        return this;
      }
    );
  }

  /**
   * Sets the presence for the logged in user.
   * @param {object} args The rich presence to pass.
   * @param {number} [pid] The application's process ID. Defaults to the executing process' PID.
   * @returns {Promise}
   */
  setActivity(args: Omit<GatewayActivity, "created_at"|"id"|"name">) {
    /*let timestamps;
    let assets;
    let party;
    let secrets;*/

    if (args.timestamps) {
      if (args.timestamps.start && args.timestamps.start > 2147483647000) {
        throw new RangeError("timestamps.start must fit into a unix timestamp");
      }
      if (args.timestamps.end && args.timestamps.end > 2147483647000) {
        throw new RangeError("timestamps.end must fit into a unix timestamp");
      }
    }

    return this.request(RPCCommands.SET_ACTIVITY, {
      pid: this.fakePid,
      /*activity: {
        state: args.state,
        details: args.details,
        timestamps,
        assets,
        party,
        secrets,
        buttons: args.buttons,
        instance: !!args.instance,
      },*/activity: args
    });
  }

  /**
   * Clears the currently set presence, if any. This will hide the "Playing X" message
   * displayed below the user's name.
   * @param {number} [pid] The application's process ID. Defaults to the executing process' PID.
   * @returns {Promise}
   */
  clearActivity(pid = this.fakePid) {
    return this.request(RPCCommands.SET_ACTIVITY, {
      pid,
    });
  }

  /**
   * Subscribe to an event
   * @param {string} event Name of event e.g. `MESSAGE_CREATE`
   * @param {Object} [args] Args for event e.g. `{ channel_id: '1234' }`
   * @returns {Promise<Object>}
   */
  async subscribe(event: string, args: any) {
    await this.request(RPCCommands.SUBSCRIBE, args, event);
    return {
      unsubscribe: () => this.request(RPCCommands.UNSUBSCRIBE, args, event),
    };
  }

  /**
   * Destroy the client
   */
  async destroy() {
    await this.transport.close();
  }
}