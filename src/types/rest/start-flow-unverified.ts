import { FlowRunId } from '../common';
import { IValue, Value } from '../values';

export interface StartFlowUnverifiedParams {
  inputs?: Record<string, IValue>;
  output_instrutions?: boolean;
}

export interface StartFlowUnverifiedOutput {
  flow_run_id: FlowRunId;
  token: string;
}
