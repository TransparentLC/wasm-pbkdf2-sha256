/** @type {globalThis} */
const GLOBAL = typeof globalThis !== 'undefined' ? globalThis : (global || self);

const {
    Uint8Array,
    WebAssembly,
} = GLOBAL;

const wasmMemory = new WebAssembly.Memory({
    'initial': 1,
});
let wasmHeapU8 = new Uint8Array(wasmMemory.buffer);
/**
 * @param {Number} size
 */
const wasmMemoryAlloc = size => {
    const wasmMemoryLength = wasmMemory.buffer.byteLength;
    if (size <= wasmMemoryLength) return;
    wasmMemory['grow'](Math.ceil((size - wasmMemoryLength) / 65536));
    wasmHeapU8 = new Uint8Array(wasmMemory.buffer);
};
const $memoryStackPointer = 0x01000;
const $memoryFreeArea = 0x01000;
const $sizeofHmacSha256Ctx = 232;

/** @typedef {Number} Pointer */

/** @type {WebAssembly.Exports} */
/**
 * @type {{
 *  __WASMEXPORTS_pbkdf2_sha256__(
 *      ctx: Pointer,
 *      key: Pointer, keyLength: Number,
 *      salt: Pointer, saltLength: Number,
 *      rounds: Number,
 *      derivedKey: Pointer, derivedKeyLength: Number
 *  ) => void,
 * }}
 */
let wasmExports;
/** @type {Promise<void>} */
const wasmReady = new Promise(resolve => WebAssembly
    .instantiate(
        Uint8Array.from(atob('__WASM_BASE64__'), e => e.charCodeAt()),
        {
            '__env__': {
                '__memory__': wasmMemory,
                '____memory_base__': 0x0000,
                '____stack_pointer__': new WebAssembly.Global(
                    {
                        'mutable': true,
                        'value': 'i32',
                    },
                    $memoryStackPointer,
                ),
            },
        }
    )
    .then(result => {
        wasmExports = result['instance']['exports'];
        resolve();
    })
);

/**
 * @param {Uint8Array} key
 * @param {Uint8Array} salt
 * @param {Number} rounds
 * @param {Number} derivedKeyLength
 * @returns {Uint8Array}
 */
const pbkdf2Sha256 = (key, salt, rounds, derivedKeyLength) => {
    const keyLength = key.length;
    const saltLength = salt.length;
    wasmMemoryAlloc($memoryFreeArea + $sizeofHmacSha256Ctx + keyLength + saltLength + derivedKeyLength);
    wasmHeapU8.set(key, $memoryFreeArea + $sizeofHmacSha256Ctx);
    wasmHeapU8.set(salt, $memoryFreeArea + $sizeofHmacSha256Ctx + keyLength);
    wasmExports['__WASMEXPORTS_pbkdf2_sha256__'](
        $memoryFreeArea,
        $memoryFreeArea + $sizeofHmacSha256Ctx, keyLength,
        $memoryFreeArea + $sizeofHmacSha256Ctx + keyLength, saltLength,
        rounds,
        $memoryFreeArea + $sizeofHmacSha256Ctx + keyLength + saltLength, derivedKeyLength
    );
    return wasmHeapU8.slice(
        $memoryFreeArea + $sizeofHmacSha256Ctx + keyLength + saltLength,
        $memoryFreeArea + $sizeofHmacSha256Ctx + keyLength + saltLength + derivedKeyLength
    );
};
pbkdf2Sha256.ready = wasmReady;
