import { Value } from '../src/types/values';

describe('test Value', () => {
  test('constructor', () => {
    const value = Value.fromJSValue({
      mint_account: 'FBnKXaHR4mKCrZwsvpUkSv8cBJkWzDMVLNCFXQcWGXsj',
      action: {
        type: 'SelectedPose',
        value: Value.U64(10),
      },
    });
    expect(value).toStrictEqual(
      new Value({
        M: {
          mint_account: { S: 'FBnKXaHR4mKCrZwsvpUkSv8cBJkWzDMVLNCFXQcWGXsj' },
          action: {
            M: {
              type: { S: 'SelectedPose' },
              value: { U: '10' },
            },
          },
        },
      })
    );
  });
});
