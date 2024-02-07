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

export interface Options {
  url?: string;
  token?: string | (() => Promise<string>);
}

export const WS_URL = 'wss://dev-api.spaceoperator.com/ws';

function noop() {}

export class WsClient {
  logger: Function = noop;
  protected url: string;
  protected identity?: AuthenticateResponse['Ok'];
  protected conn?: WebSocket;
  protected counter: number = 0;
  protected token?: string | (() => Promise<string>);
  protected reqCallbacks: Map<number, { resolve: Function; reject: Function }> =
    new Map();
  protected streamCallbacks: Map<number, { callback: Function }> = new Map();

  constructor(options: Options) {
    this.url = options.url ?? WS_URL;
    this.token = options.token;
  }

  setToken(token: string | (() => Promise<string>)) {
    this.token = token;
  }

  async getToken(): Promise<string | null> {
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

  connect() {
    if (this.conn) return;
    this.conn = new WebSocket(this.url);
    this.conn.onopen = () => this.onConnOpen();
    this.conn.onmessage = (event) => this.onConnMessage(event);
    this.conn.onerror = (error) => this.onConnError(error);
    this.conn.onclose = (event) => this.onConnClose(event);
  }

  disconnect() {
    this.conn = undefined;
  }

  onConnClose(event: any) {
    this.log('closing', event);
    this.disconnect();
  }

  onConnError(event: any) {
    this.log('error', event);
    this.disconnect();
  }

  onConnMessage(msg: { data: any }) {
    if (typeof msg.data === 'string') {
      const json = JSON.parse(msg.data);
      this.log('received', msg);
      if (json.id != null) {
        const cb = this.reqCallbacks.get(json.id);
        if (cb != null) {
          this.reqCallbacks.delete(json.id);
          cb.resolve(json);
        }
      } else if (json.stream_id != null) {
        const cb = this.streamCallbacks.get(json.id);
        if (cb != null) {
          cb.callback(json);
        }
      }
    }
  }

  log(msg: string, data?: any) {
    this.logger(msg, data);
  }

  nextId(): number {
    this.counter += 1;
    if (this.counter > 0xffffffff) this.counter = 0;
    return this.counter;
  }

  async send(msg: {
    id: number;
    method: string;
    params: any;
  }): Promise<WsResponse<any>> {
    this.log('sending', msg);
    const json = JSON.stringify(msg);
    if (this.conn) {
      this.conn.send(json);
      return await new Promise((resolve, reject) => {
        this.reqCallbacks.set(msg.id, { resolve, reject });
      });
    } else {
      throw 'not connected';
    }
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

  onConnOpen() {
    this.authenticate();
  }

  async subscribeFlowRunEvents(
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

  async subscribeSignatureRequest(
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
}
