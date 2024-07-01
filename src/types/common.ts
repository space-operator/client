export type FlowId = number;
export type FlowRunId = string;
export type NodeId = string;
export type UserId = string;
export interface ErrorBody {
  error: string;
}
export type RestResult<T> = T | ErrorBody;
