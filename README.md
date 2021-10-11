# wasm-pbkdf2-sha256

[![build](https://github.com/TransparentLC/wasm-pbkdf2-sha256/actions/workflows/build.yml/badge.svg)](https://github.com/TransparentLC/wasm-pbkdf2-sha256/actions/workflows/build.yml)

使用 WASM 运行的 PBKDF2-SHA256 密钥派生算法，预编译版可在 [Releases](https://github.com/TransparentLC/wasm-pbkdf2-sha256/releases) 下载。

实现来自 [monolifed/pbkdf2-hmac-sha256](https://github.com/monolifed/pbkdf2-hmac-sha256)。运行结果和 Node.js 自带的 `crypto` 模块相同。

## 使用方式

```js
/**
 * @param {Uint8Array} key 长度任意的密码
 * @param {Uint8Array} salt 长度任意的盐
 * @param {Number} rounds 迭代次数
 * @param {Number} derivedKeyLength 输出密钥的长度
 * @returns {Uint8Array}
 */
const pbkdf2Sha256 = (key, salt, rounds, derivedKeyLength) => {};

/** @type {Promise<void>} 在WASM模块加载完成后fulfill的Promise */
pbkdf2Sha256.ready = wasmReady;
```

## 编译

需要安装 [Emscripten](https://emscripten.org) 和 [Node.js](https://nodejs.org) 环境。

```bash
npm install
node build.js
```

运行后可以在 `dist` 目录找到以下文件：

* `pbkdf2-sha256.{mode}.wasm`
* `pbkdf2-sha256-wasm.{mode}.{moduleFormat}.js`
* `pbkdf2-sha256-wasm.{mode}.{moduleFormat}.min.js`
* `pbkdf2-sha256-wasm.d.ts`

`{mode}` 是 size 和 speed 之一，对应文件大小或运行速度的优化（也就是 Emscripten 编译时使用的 `-Oz` 或 `-O3` 参数）。`{moduleFormat}` 是 `cjs` 和 `esm` 之一，分别对应 CommonJS 和 ES Modules 模块。使用时在浏览器 / Node.js 中加载 JS 文件即可，WASM 文件可以不保留。

> size 大约是 4 KB，而 speed 大约是 7 KB，但是速度是 size 的 4x 以上，所以还是选 speed 吧 (っ'ω')っ


## 测试

以 Node.js 的 `crypto.pbkdf2Sync` 作为参考，检查运行结果是否相同。运行 `node benchmark.js` 进行测试，`key` 和 `salt` 长度分别为 32 和 16，`derivedKeyLength` 为 128，增加长度也会增加运行时间。

以下测试结果是在 WSL Ubuntu 20.04 Node.js v14.15.5 下运行的，仅供参考，时间单位均为 ms：

| 迭代次数 | Node.js 耗时 | `-O3` 版耗时 | `-Oz` 版耗时 | `-O3` 版速度比例 | `-Oz` 版速度比例 |
| - | - | - | - | - | - |
| 1 | 0.26 | 0.06 | 0.08 | 4.76 | 3.12 |
| 2 | 0.03 | 0.01 | 0.04 | 2.28 | 0.72 |
| 4 | 0.04 | 0.02 | 0.06 | 2.02 | 0.57 |
| 8 | 0.03 | 0.03 | 0.12 | 0.83 | 0.23 |
| 16 | 0.04 | 0.06 | 0.23 | 0.72 | 0.17 |
| 32 | 0.07 | 0.11 | 0.44 | 0.63 | 0.15 |
| 64 | 0.13 | 0.21 | 0.88 | 0.61 | 0.14 |
| 128 | 0.24 | 0.41 | 1.72 | 0.59 | 0.14 |
| 256 | 0.46 | 0.81 | 3.50 | 0.57 | 0.13 |
| 512 | 0.92 | 1.62 | 6.87 | 0.57 | 0.13 |
| 1024 | 1.82 | 3.33 | 14.27 | 0.55 | 0.13 |
| 2048 | 3.86 | 6.45 | 28.62 | 0.60 | 0.13 |
| 4096 | 7.21 | 13.30 | 57.07 | 0.54 | 0.13 |
| 8192 | 14.53 | 26.21 | 110.05 | 0.55 | 0.13 |
| 16384 | 29.29 | 52.59 | 221.21 | 0.56 | 0.13 |
| 32768 | 57.92 | 103.53 | 444.04 | 0.56 | 0.13 |
| 65536 | 118.92 | 209.50 | 912.31 | 0.57 | 0.13 |
| 131072 | 237.70 | 418.75 | 1788.44 | 0.57 | 0.13 |
| 262144 | 470.09 | 838.59 | 3565.37 | 0.56 | 0.13 |
| 524288 | 943.51 | 1670.14 | 7158.43 | 0.56 | 0.13 |
| 1048576 | 1877.87 | 3359.03 | 14277.52 | 0.56 | 0.13 |
