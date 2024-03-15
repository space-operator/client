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

  constructor(x?: any, customConvert?: (x: any) => Value | null) {
    if (x === undefined) {
      return Value.Null();
    }

    const value = Value.inferFromJSType(x, customConvert);
    if (value === null) throw TypeError('null');
    return value;
  }

  public static inferFromJSType(
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
        return Value.Decimal(x);
      case 'boolean':
        return Value.Boolean(x);
      case 'string':
        return Value.String(x);
      case 'undefined':
        return Value.Null();
      case 'bigint':
        if (x < BigInt(0)) {
          return Value.I128(x);
        } else {
          return Value.U128(x);
        }
      case 'symbol':
        return Value.String(x.toString());
      case 'object':
        if (x === null) {
          return Value.Null();
        }
        if (maybePublicKey(x)) {
          return Value.fromJSON({ B3: x.toBase58() });
        }
        if (maybeKeypair(x)) {
          return Value.fromJSON({
            B6: bs58.encode([...x.secretKey, ...x.publicKey.encode()]),
          });
        }
        if (x.byteLength != null) {
          switch (x.byteLength) {
            case 32:
              return Value.fromJSON({
                B3: bs58.encode(x),
              });
            case 64:
              return Value.fromJSON({
                B6: bs58.encode(x),
              });
            default:
              return Value.fromJSON({
                BY: base64.fromByteArray(x),
              });
          }
        }
        if (customConvert !== undefined) {
          const result = customConvert(x);
          if (result != null) {
            return result;
          }
        }
        if (Array.prototype.isPrototypeOf(x)) {
          return Value.fromJSON({
            A: Array.from(x)
              .map((x) => Value.inferFromJSType(x, customConvert))
              .filter((x) => x != null) as IValue[],
          });
        }
        return Value.fromJSON({
          M: Object.fromEntries(
            Object.entries(x)
              .map(([k, v]) => [k, Value.inferFromJSType(v, customConvert)])
              .filter(([_k, v]) => v != null)
          ),
        });
    }
  }

  public static fromJSON(obj: IValue): Value {
    if (obj instanceof Value) {
      return obj;
    }

    if (obj.A) {
      obj.A = obj.A.map(Value.fromJSON);
    } else if (obj.M) {
      obj.M = Object.fromEntries(
        Object.entries(obj.M).map(([k, v]) => [k, Value.fromJSON(v)])
      );
    }
    return Object.assign(Object.create(Value.prototype), obj);
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
    return Value.fromJSON({ U: i.toString() });
  }

  public static I64(x: string | number | bigint): Value {
    const i = BigInt(x);
    if (
      i < BigInt('-9223372036854775808') ||
      i > BigInt('9223372036854775807')
    ) {
      throw new Error('value out of range');
    }
    return Value.fromJSON({ I: i.toString() });
  }

  public static String(x: string): Value {
    return Value.fromJSON({ S: x });
  }

  public static Float(x: number): Value {
    return Value.fromJSON({ F: x.toString() });
  }

  public static Decimal(x: number | string | BigInt): Value {
    return Value.fromJSON({ D: x.toString() });
  }

  public static Null(): Value {
    return Value.fromJSON({ N: 0 });
  }

  public static Boolean(x: boolean): Value {
    return Value.fromJSON({ B: x });
  }

  public static U128(x: string | number | bigint): Value {
    const i = BigInt(x);
    if (
      i < BigInt(0) ||
      i > BigInt('340282366920938463463374607431768211455')
    ) {
      throw new Error('value out of range');
    }
    return Value.fromJSON({ U1: i.toString() });
  }

  public static I128(x: string | number | bigint): Value {
    const i = BigInt(x);
    if (
      i < BigInt('-170141183460469231731687303715884105728') ||
      i > BigInt('170141183460469231731687303715884105727')
    ) {
      throw new Error('value out of range');
    }
    return Value.fromJSON({ I1: i.toString() });
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
