import { FlowRunId } from '../common';
import { Value } from '../values';

export interface StartFlowUnverifiedParams {
  inputs?: Record<string, Value>;
}

export interface StartFlowUnverifiedOutput {
  flow_run_id: FlowRunId;
  token: string;
}
