import { FlowRunId } from './types/common';
import {
  AuthenticateRequest,
  AuthenticateResponse,
  FlowRunEvent,
  SignatureRequest,
  SignatureRequestsEvent,
  SubscribeFlowRunEventsRequest,
  SubscribeFlowRunEventsResponse,
  SubscribeSignatureRequestsRequest,
  SubscribeSignatureRequestsResponse,
  WsResponse,
} from './types/ws';

export interface WcClientOptions {
  url?: string;
  token?: string | (() => Promise<string>);
  logger?: (msg: string, data: any) => any;
}

export const WS_URL = 'wss://dev-api.spaceoperator.com/ws';

function noop() {}

export class WsClient {
  private identity?: AuthenticateResponse['Ok'];
  private logger: Function = noop;
  private url: string;
  private conn?: WebSocket;
  private counter: number = 0;
  private token?: string | (() => Promise<string>);
  private reqCallbacks: Map<number, { resolve: Function; reject: Function }> =
    new Map();
  private streamCallbacks: Map<number, { callback: Function }> = new Map();
  private queue: Array<string> = [];

  constructor(options: WcClientOptions) {
    this.url = options.url ?? WS_URL;
    this.token = options.token;
    this.logger = options.logger ?? noop;
  }

  public getIdentity(): WsClient['identity'] {
    return this.identity;
  }

  public setLogger(logger: Function) {
    this.logger = logger;
  }

  public setToken(token: string | (() => Promise<string>)) {
    this.token = token;
  }

  public async subscribeFlowRunEvents(
    callback: (ev: FlowRunEvent) => any,
    id: FlowRunId,
    token?: string
  ) {
    const result: SubscribeFlowRunEventsResponse = await this.send(
      new SubscribeFlowRunEventsRequest(this.nextId(), id, token)
    );
    if (result.Err != null) {
      throw result.Err;
    }
    if (result.Ok != null) {
      this.streamCallbacks.set(result.Ok.stream_id, {
        callback: (ev: FlowRunEvent) => {
          if (ev.event === 'SignatureRequest') {
            ev.data = new SignatureRequest(ev.data);
          }
          callback(ev);
        },
      });
    }
  }

  public async subscribeSignatureRequest(
    callback: (ev: SignatureRequestsEvent) => any
  ) {
    const result: SubscribeSignatureRequestsResponse = await this.send(
      new SubscribeSignatureRequestsRequest(this.nextId())
    );
    if (result.Err != null) {
      throw result.Err;
    }
    if (result.Ok != null) {
      this.streamCallbacks.set(result.Ok.stream_id, {
        callback: (ev: SignatureRequestsEvent) => {
          if (ev.event === 'SignatureRequest') {
            ev.data = new SignatureRequest(ev.data);
          }
          callback(ev);
        },
      });
    }
  }

  private async getToken(): Promise<string | null> {
    if (this.token == null) return null;
    switch (typeof this.token) {
      case 'string':
        return this.token;
      case 'function':
        return await this.token();
      default:
        throw 'invalid token type';
    }
  }

  private connect() {
    if (this.conn != null) return;
    this.conn = new WebSocket(this.url);
    this.conn.onopen = () => this.onConnOpen();
    this.conn.onmessage = (event) => this.onConnMessage(event);
    this.conn.onerror = (error) => this.onConnError(error);
    this.conn.onclose = (event) => this.onConnClose(event);
  }

  private disconnect() {
    this.conn = undefined;
    this.reqCallbacks.forEach(({ reject }) => {
      reject('disconnected');
    });
    this.streamCallbacks.clear();
    this.reqCallbacks.clear();
  }

  private onConnClose(event: any) {
    this.log('closing', event);
    this.disconnect();
  }

  private onConnError(event: any) {
    this.log('error', event);
    this.disconnect();
  }

  private onConnMessage(msg: { data: any }) {
    if (typeof msg.data === 'string') {
      const json = JSON.parse(msg.data);
      this.log('received', json);
      if (json.id != null) {
        const cb = this.reqCallbacks.get(json.id);
        if (cb != null) {
          this.reqCallbacks.delete(json.id);
          cb.resolve(json);
        } else {
          throw `no callback for req ${json.id}`;
        }
      } else if (json.stream_id != null) {
        const cb = this.streamCallbacks.get(json.stream_id);
        if (cb != null) {
          cb.callback(json);
        } else {
          throw `no callback for stream ${json.steam_id}`;
        }
      } else {
        throw 'invalid message';
      }
    }
  }

  private log(msg: string, data?: any) {
    this.logger(msg, data);
  }

  private nextId(): number {
    this.counter += 1;
    if (this.counter > 0xffffffff) this.counter = 0;
    return this.counter;
  }

  private async send(msg: {
    id: number;
    method: string;
    params: any;
  }): Promise<WsResponse<any>> {
    const text = JSON.stringify(msg);
    if (this.conn != null) {
      this.log('sending', msg);
      this.conn.send(text);
    } else {
      this.log('queueing', msg);
      this.queue.push(text);
      this.connect();
    }
    return await new Promise((resolve, reject) => {
      this.reqCallbacks.set(msg.id, { resolve, reject });
    });
  }

  async authenticate() {
    const token = await this.getToken();
    if (token != null) {
      const result: AuthenticateResponse = await this.send(
        new AuthenticateRequest(this.nextId(), token)
      );
      if (result.Err != null) {
        console.error('Authenticate error', result.Err);
      }
      if (result.Ok != null) {
        this.identity = result.Ok;
      }
    }
  }

  private async onConnOpen() {
    await this.authenticate();
    this.queue = this.queue.filter((msg) => {
      if (this.conn != undefined) {
        this.log('sending queued message', msg);
        this.conn.send(msg);
        return false;
      } else {
        return true;
      }
    });
  }
}
