import { PublicKey } from '@solana/web3.js';
import { FlowId, FlowRunId, RestResult } from './types/common';
import { StartFlowOutput, StartFlowParams } from './types/rest/start-flow';
import {
  StartFlowUnverifiedOutput,
  StartFlowUnverifiedParams,
} from './types/rest/start-flow-unverified';
import {
  StartFlowSharedOutput,
  StartFlowSharedParams,
} from './types/rest/start-flow-shared';
import { StopFlowOutput, StopFlowParams } from './types/rest/stop-flow';
import {
  SubmitSignatureOutput,
  SubmitSignatureParams,
} from './types/rest/submit-signature';

export interface Options {
  url?: string;
  token?: string | (() => Promise<string>);
}

const REST_URL = 'https://dev-api.spaceoperator.com';

export class Client {
  url: string;
  token?: string | (() => Promise<string>);

  constructor(options: Options) {
    this.url = options.url ?? REST_URL;
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

  async startFlow(
    id: FlowId,
    params: StartFlowParams
  ): Promise<RestResult<StartFlowOutput>> {
    try {
      const token = await this.getToken();
      if (token == null) {
        throw 'no authentication token';
      }
      const resp = await fetch(`${this.url}/flow/start/${id}`, {
        method: 'POST',
        headers: {
          authorization: token,
          'content-type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      return await resp.json();
    } catch (error: any) {
      return { error: error.toString() };
    }
  }

  async startFlowShared(
    id: FlowId,
    params: StartFlowSharedParams
  ): Promise<RestResult<StartFlowSharedOutput>> {
    try {
      const token = await this.getToken();
      if (token == null) {
        throw 'no authentication token';
      }
      const resp = await fetch(`${this.url}/flow/start_shared/${id}`, {
        method: 'POST',
        headers: {
          authorization: token,
          'content-type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      return await resp.json();
    } catch (error: any) {
      return { error: error.toString() };
    }
  }

  async startFlowUnverified(
    id: FlowId,
    publicKey: PublicKey,
    params: StartFlowUnverifiedParams
  ): Promise<RestResult<StartFlowUnverifiedOutput>> {
    try {
      const resp = await fetch(`${this.url}/flow/start_unverified/${id}`, {
        method: 'POST',
        headers: {
          authorization: publicKey.toBase58(),
          'content-type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      return await resp.json();
    } catch (error: any) {
      return { error: error.toString() };
    }
  }

  async stopFlow(
    runId: FlowRunId,
    params: StopFlowParams
  ): Promise<RestResult<StopFlowOutput>> {
    try {
      const token = await this.getToken();
      if (token == null) {
        throw 'no authentication token';
      }
      const resp = await fetch(`${this.url}/flow/stop/${runId}`, {
        method: 'POST',
        headers: {
          authorization: token,
          'content-type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      return await resp.json();
    } catch (error: any) {
      return { error: error.toString() };
    }
  }

  async submitSignature(
    params: SubmitSignatureParams
  ): Promise<RestResult<SubmitSignatureOutput>> {
    try {
      const resp = await fetch(`${this.url}/signature/submit`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      return await resp.json();
    } catch (error: any) {
      return { error: error.toString() };
    }
  }
}
