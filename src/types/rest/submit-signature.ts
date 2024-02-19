export interface SubmitSignatureParams {
  id: number;
  signature: string;
  new_msg?: string;
}

export interface SubmitSignatureOutput {
  success: true;
}
