import { Keypair, PublicKey } from '@solana/web3.js';
import * as bs58 from 'bs58';

export interface IValue {
  S?: string;
  D?: string;
  I?: string;
  U?: string;
  I1?: string;
  U1?: string;
  F?: string;
  B?: boolean;
  N?: 0;
  B3?: string;
  B6?: string;
  BY?: string;
  A?: IValue[];
  M?: Record<string, IValue>;
}

export class Value implements IValue {
  S?: string;
  D?: string;
  I?: string;
  U?: string;
  I1?: string;
  U1?: string;
  F?: string;
  B?: boolean;
  N?: 0;
  B3?: string;
  B6?: string;
  BY?: string;
  A?: Value[];
  M?: Record<string, Value>;

  constructor(obj: IValue) {
    return Object.assign(this, obj);
  }

  public type(): string {
    return Object.keys(this)[0];
  }

  public value(): string | 0 | boolean | Value[] | Record<string, Value> {
    return Object.values(this)[0];
  }

  // public static fromJSValue(
  //   x: any,
  //   customConvert?: (x: any) => Value | null
  // ): Value | null {
  //   switch (typeof x) {
  //     case 'number':
  //       return new Value({ D: x.toString() });
  //     case 'boolean':
  //       return new Value({ B: x });
  //     case 'string':
  //       return new Value({ S: x });
  //     case 'undefined':
  //       return new Value({ N: 0 });
  //     case 'function':
  //       return null;
  //     case 'bigint':
  //       return new Value({ D: x.toString() });
  //     case 'object':
  //       if (x === null) {
  //         return new Value({ N: 0 });
  //       }
  //       if (x.length != null) {
  //         return new Value({
  //           A: Array.from(x)
  //             .map((x) => Value.fromJSValue(x, customConvert))
  //             .filter((x) => x != null) as IValue[],
  //         });
  //       }
  //       if (x instanceof PublicKey) {
  //         return new Value({ B3: x.toBase58() });
  //       }
  //       if (x instanceof Keypair) {
  //         return new Value({
  //           B6: bs58.encode([...x.secretKey, ...x.publicKey.encode()]),
  //         });
  //       }
  //       if (x.byteLength != null) {
  //         switch (x.byteLength) {
  //           case 32:
  //             return new Value({
  //               B3: bs58.encode(x),
  //             });
  //           case 64:
  //             return new Value({
  //               B6: bs58.encode(x),
  //             });
  //           default:
  //             return new Value({
  //               BY: x.toString('base64'),
  //             });
  //         }
  //       }
  //       if (customConvert != null) {
  //         const result = customConvert(x);
  //         if (result != null) {
  //           return result;
  //         }
  //       }
  //       return new Value({
  //         M: Object.fromEntries(
  //           Object.entries(x)
  //             .map(([k, v]) => [k, Value.fromJSValue(v, customConvert)])
  //             .filter(([_k, v]) => v != null)
  //         ),
  //       });
  //     default:
  //       return null;
  //   }
  // }

  public toJSObject(): any {
    if (this.S != null) return this.S;
    if (this.D != null) return parseFloat(this.D);
    if (this.I != null) return parseFloat(this.I);
    if (this.U != null) return parseFloat(this.U);
    if (this.I1 != null) return parseFloat(this.I1);
    if (this.U1 != null) return parseFloat(this.U1);
    if (this.F != null) return parseFloat(this.F);
    if (this.B != null) return this.B;
    if (this.N != null) return null;
    if (this.B3 != null) return bs58.decode(this.B3);
    if (this.B6 != null) return bs58.decode(this.B6);
    if (this.BY != null) return new TextEncoder().encode(atob(this.BY));
    if (this.A != null) return this.A.map((x) => x.toJSObject());
    if (this.M != null)
      return Object.fromEntries(
        Object.entries(this.M).map(([k, v]) => [k, v.toJSObject()])
      );
    throw 'invalid value';
  }
}
