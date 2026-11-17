import test from 'node:test';
import assert from 'node:assert/strict';
import { isStrongPassword as backend } from '../src/utils/password-policy.js';
import { isStrongPassword as frontend } from '../../mail-vue/src/utils/password-policy.js';

for (const [name, validate] of [['backend', backend], ['frontend', frontend]]) {
    test(`${name}: rejects weak passwords and accepts the requested minimum`, () => {
        for (const value of [null, undefined, 12345678, '', 'Abcd1!x', '12345678', 'harshvardhan', 'Password1', 'Password!', 'abcdef1 ', 'abcdef1é']) {
            assert.equal(validate(value), false, `Should reject ${JSON.stringify(value)}`);
        }
        for (const value of ['Abcdef1!', '1234567!', 'a long password 1#', '名字密码测试1!']) {
            assert.equal(validate(value), true, `Should accept ${JSON.stringify(value)}`);
        }
    });
}

test('generated account passwords satisfy the policy', async () => {
    const { default: cryptoUtils } = await import('../src/utils/crypto-utils.js');
    for (let i = 0; i < 50; i++) {
        const password = cryptoUtils.genRandomPwd();
        assert.equal(password.length, 12);
        assert.equal(backend(password), true);
    }
});
