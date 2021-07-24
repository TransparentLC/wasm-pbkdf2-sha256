const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const ReplacementCollector = require('./replacement-collector.js');

if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

for (const [optimizeMode, optimizeParam] of [
    ['speed', '-O3'],
    ['size', '-Oz'],
]) {
    const uniqueId = Math.random().toString(36).slice(2, 10);
    const rc = new ReplacementCollector(/\$\$.+?\$\$/g, {
        $$UNIQUE_ID$$: uniqueId,
        $$WASM_BASE64$$: null,
    });
    for (const f of [
        'pbkdf2-sha256-wasm-template.js',
        ...fs.readdirSync('src').map(e => `src/${e}`),
    ]) {
        rc.collect(fs.readFileSync(f, { encoding: 'utf-8' }));
    }

    const srcDir = `${os.tmpdir()}/wasm-pbkdf2-sha256-${uniqueId}`;
    const templateFile = `${os.tmpdir()}/pbkdf2-sha256-wasm-template-${uniqueId}.js`;
    fs.mkdirSync(srcDir);
    for (const f of fs.readdirSync('src')) {
        fs.writeFileSync(
            `${srcDir}/${f}`,
            rc.applyReplace(fs.readFileSync(`src/${f}`, { encoding: 'utf-8' }))
        );
    }
    fs.writeFileSync(
        templateFile,
        rc.applyReplace(fs.readFileSync('pbkdf2-sha256-wasm-template.js', { encoding: 'utf-8' }))
    );

    childProcess.spawnSync(
        'emcc',
        [
            ...fs.readdirSync(srcDir).filter(e => e.endsWith('.c')).map(e => `${srcDir}/${e}`),
            optimizeParam,
            '-v',
            '-flto',
            '-s', 'SIDE_MODULE=2',
            '-o', `dist/pbkdf2-sha256.${optimizeMode}.wasm`,
        ],
        {
            stdio: ['ignore', 1, 2],
        }
    );

    fs.rmSync(srcDir, { recursive: true });
    rc.mapping.set('$$WASM_BASE64$$', fs.readFileSync(`dist/pbkdf2-sha256.${optimizeMode}.wasm`, { encoding: 'base64' }).replace(/=+$/g, ''));

    fs.writeFileSync(
        `dist/pbkdf2-sha256-wasm.${optimizeMode}.js`,
        rc.applyReplace(fs.readFileSync(templateFile, { encoding: 'utf-8' }))
    );
    fs.unlinkSync(templateFile);
    fs.copyFileSync('pbkdf2-sha256-wasm-template.d.ts', `dist/pbkdf2-sha256-wasm.${optimizeMode}.d.ts`);

    childProcess.spawnSync(
        'terser',
        [
            '--ecma', '2020',
            '--compress', 'unsafe_math,unsafe_methods,unsafe_proto,unsafe_regexp,unsafe_undefined,passes=2',
            '--mangle',
            '--mangle-props', 'keep_quoted=strict',
            '--comments', 'false',
            '--output', `dist/pbkdf2-sha256-wasm.${optimizeMode}.min.js`,
            `dist/pbkdf2-sha256-wasm.${optimizeMode}.js`,
        ],
        {
            stdio: ['ignore', 1, 2],
        }
    );
    fs.copyFileSync('pbkdf2-sha256-wasm-template.d.ts', `dist/pbkdf2-sha256-wasm.${optimizeMode}.min.d.ts`);
}