import { FlowRunId } from '../common';
import { Value } from '../values';

export interface StartFlowSharedParams {
  inputs: Record<string, Value>;
}

export interface StartFlowSharedOutput {
  flow_run_id: FlowRunId;
}
