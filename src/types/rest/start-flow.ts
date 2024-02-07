import { FlowRunId, NodeId } from '../common';
import { Value } from '../values';

export interface ValuesConfig {
  nodes: Record<NodeId, FlowRunId>;
  default_run_id?: FlowRunId;
}

export interface PartialConfig {
  only_nodes: Array<NodeId>;
  values_config: ValuesConfig;
}

export interface StartFlowParams {
  inputs: Record<string, Value>;
  partial_config?: PartialConfig;
  environment?: Record<string, string>;
}

export interface StartFlowOutput {
  flow_run_id: FlowRunId;
}
