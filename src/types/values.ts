import * as bs58 from 'bs58';
import * as base64 from 'base64-js';

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

function maybePublicKey(x: any): boolean {
  if (x == null) return false;
  return (
    typeof x.toBase58 === 'function' &&
    typeof x.toBuffer === 'function' &&
    x.toBuffer()?.byteLength === 32
  );
}

function maybeKeypair(x: any): boolean {
  if (x == null) return false;
  return maybePublicKey(x.publicKey) && x.secretKey?.byteLength === 32;
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

  public static U64(x: string | number | bigint): Value {
    const i = BigInt(x);
    if (i < BigInt(0) || i > BigInt('18446744073709551615')) {
      throw new Error('value out of range');
    }
    return new Value({ U: i.toString() });
  }

  public static I64(x: string | number | bigint): Value {
    const i = BigInt(x);
    if (
      i < BigInt('-9223372036854775808') ||
      i > BigInt('9223372036854775807')
    ) {
      throw new Error('value out of range');
    }
    return new Value({ I: i.toString() });
  }

  public static String(x: string): Value {
    return new Value({ S: x });
  }

  public static Float(x: number): Value {
    return new Value({ F: x.toString() });
  }

  public static Number(x: number | string | BigInt): Value {
    return new Value({ D: x.toString() });
  }

  public static Null(): Value {
    return new Value({ N: 0 });
  }

  public static Boolean(x: boolean): Value {
    return new Value({ B: x });
  }

  public static U128(x: string | number | bigint): Value {
    const i = BigInt(x);
    if (
      i < BigInt(0) ||
      i > BigInt('340282366920938463463374607431768211455')
    ) {
      throw new Error('value out of range');
    }
    return new Value({ U1: i.toString() });
  }

  public static I128(x: string | number | bigint): Value {
    const i = BigInt(x);
    if (
      i < BigInt('-170141183460469231731687303715884105728') ||
      i > BigInt('170141183460469231731687303715884105727')
    ) {
      throw new Error('value out of range');
    }
    return new Value({ I1: i.toString() });
  }

  public static fromJSValue(
    x: any,
    customConvert?: (x: any) => Value | null
  ): Value | null {
    if (x instanceof Value) {
      return x;
    }
    switch (typeof x) {
      case 'function':
        return null;
      case 'number':
        return new Value({ D: x.toString() });
      case 'boolean':
        return new Value({ B: x });
      case 'string':
        return new Value({ S: x });
      case 'undefined':
        return new Value({ N: 0 });
      case 'bigint':
        return new Value({ I1: x.toString() });
      case 'symbol':
        return new Value({ S: x.toString() });
      case 'object':
        if (x === null) {
          return new Value({ N: 0 });
        }
        if (maybePublicKey(x)) {
          return new Value({ B3: x.toBase58() });
        }
        if (maybeKeypair(x)) {
          return new Value({
            B6: bs58.encode([...x.secretKey, ...x.publicKey.encode()]),
          });
        }
        if (x.byteLength != null) {
          switch (x.byteLength) {
            case 32:
              return new Value({
                B3: bs58.encode(x),
              });
            case 64:
              return new Value({
                B6: bs58.encode(x),
              });
            default:
              return new Value({
                BY: base64.fromByteArray(x),
              });
          }
        }
        if (customConvert != null) {
          const result = customConvert(x);
          if (result != null) {
            return result;
          }
        }
        if (Array.prototype.isPrototypeOf(x)) {
          return new Value({
            A: Array.from(x)
              .map((x) => Value.fromJSValue(x, customConvert))
              .filter((x) => x != null) as IValue[],
          });
        }
        return new Value({
          M: Object.fromEntries(
            Object.entries(x)
              .map(([k, v]) => [k, Value.fromJSValue(v, customConvert)])
              .filter(([_k, v]) => v != null)
          ),
        });
    }
  }

  public toJSObject(): any {
    if (this.S != null) return this.S;
    if (this.D != null) return parseFloat(this.D);
    if (this.I != null) return parseFloat(this.I);
    if (this.U != null) return parseFloat(this.U);
    if (this.I1 != null) return BigInt(this.I1);
    if (this.U1 != null) return BigInt(this.U1);
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
