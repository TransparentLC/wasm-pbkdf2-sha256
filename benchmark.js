if (typeof btoa === 'undefined') {
    global.btoa = str => Buffer.from(str, 'binary').toString('base64');
}

if (typeof atob === 'undefined') {
    global.atob = b64Encoded => Buffer.from(b64Encoded, 'base64').toString('binary');
}

const { performance } = require('perf_hooks');

const crypto = require('crypto');
const pbkdf2Size = require('./dist/pbkdf2-sha256-wasm.size.cjs.min.js');
const pbkdf2Speed = require('./dist/pbkdf2-sha256-wasm.speed.cjs.min.js');

(async () => {

await Promise.all([
    pbkdf2Size.ready,
    pbkdf2Speed.ready,
]);

const result = [];
let start;
let end;

for (let i = 0; i <= 20; i++) {
    const key = crypto.randomBytes(32);
    const salt = crypto.randomBytes(16);
    const rounds = Math.pow(2, i);
    const derivedKeyLength = 128;

    start = performance.now();
    const nodeDerived = crypto.pbkdf2Sync(key, salt, rounds, derivedKeyLength, 'sha256');
    end = performance.now();
    const nodeTime = end - start;

    start = performance.now();
    const pbkdf2SizeDerived = pbkdf2Size(key, salt, rounds, derivedKeyLength);
    end = performance.now();
    const pbkdf2SizeTime = end - start;

    start = performance.now();
    const pbkdf2SpeedDerived = pbkdf2Speed(key, salt, rounds, derivedKeyLength);
    end = performance.now();
    const pbkdf2SpeedTime = end - start;

    if (!nodeDerived.equals(Buffer.from(pbkdf2SizeDerived)) || !nodeDerived.equals(Buffer.from(pbkdf2SpeedDerived))) {
        throw new Error('Not equal');
    }

    result.push({
        rounds,
        nodeTime,
        pbkdf2SizeTime,
        pbkdf2SpeedTime,
        pbkdf2SizeRatio: nodeTime / pbkdf2SizeTime,
        pbkdf2SpeedRatio: nodeTime / pbkdf2SpeedTime,
    });
}

console.table(result);

})();
