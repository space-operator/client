import { Value } from '../src/types/values';

describe('Value', () => {
  test('pose flow inputs', () => {
    const value = new Value({
      mint_account: 'FBnKXaHR4mKCrZwsvpUkSv8cBJkWzDMVLNCFXQcWGXsj',
      action: {
        type: 'SelectedPose',
        value: Value.U64(10),
      },
    });
    const expected = Value.fromJSON({
      M: {
        mint_account: { S: 'FBnKXaHR4mKCrZwsvpUkSv8cBJkWzDMVLNCFXQcWGXsj' },
        action: {
          M: {
            type: { S: 'SelectedPose' },
            value: { U: '10' },
          },
        },
      },
    });
    expect(value).toStrictEqual(expected);
  });

  test('no op', () => {
    const x = Value.Null();
    expect(new Value(x)).toBe(x);
    expect(Value.fromJSON(x)).toBe(x);
  });

  test('primitives', () => {
    expect(JSON.stringify(new Value())).toBe('{"N":0}');
    expect(JSON.stringify(new Value(0))).toBe('{"D":"0"}');
    expect(JSON.stringify(new Value('Hello'))).toBe('{"S":"Hello"}');
    expect(JSON.stringify(new Value(false))).toBe('{"B":false}');
    expect(JSON.stringify(new Value(null))).toBe('{"N":0}');
    expect(JSON.stringify(new Value(BigInt('9999999999999')))).toBe(
      '{"U1":"9999999999999"}'
    );
    expect(JSON.stringify(new Value(BigInt('-9999999999999')))).toBe(
      '{"I1":"-9999999999999"}'
    );
  });
});
