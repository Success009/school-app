/**
 * Production Asset Minifier & Obfuscation Pipeline
 * 
 * Compresses web application JavaScript, strips all source comments,
 * and mangles identifiers for production deployment while preserving
 * development files for easy local debugging.
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const TARGET_FILES = [
    'login.js',
    'shared.js',
    'modules/validation.js',
    'modules/offlineStore.js',
    'modules/api.js',
    'modules/auth.js',
    'modules/db.js'
];

async function buildProduction() {
    console.log('\x1b[35m=== RUNNING PRODUCTION OBFUSCATION & MINIFICATION ===\x1b[0m');
    const outDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    let totalOriginal = 0;
    let totalMinified = 0;

    for (const relPath of TARGET_FILES) {
        const fullPath = path.join(__dirname, relPath);
        if (!fs.existsSync(fullPath)) continue;

        const code = fs.readFileSync(fullPath, 'utf8');
        totalOriginal += code.length;

        const result = await minify(code, {
            compress: {
                drop_console: false, // Keep console warnings for operational telemetry
                dead_code: true
            },
            mangle: true,
            format: {
                comments: false // Strip all comments completely from public code
            }
        });

        const destPath = path.join(outDir, relPath);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, result.code, 'utf8');
        totalMinified += result.code.length;

        const savings = (((code.length - result.code.length) / code.length) * 100).toFixed(1);
        console.log(`\x1b[32m✔ Obfuscated:\x1b[0m ${relPath} (${code.length}B -> ${result.code.length}B, -${savings}%)`);
    }

    console.log(`\x1b[36mOverall savings: ${totalOriginal}B -> ${totalMinified}B (${(((totalOriginal - totalMinified) / totalOriginal) * 100).toFixed(1)}% reduction)\x1b[0m`);
    console.log('\x1b[32mProduction artifacts successfully generated in ./dist/\x1b[0m');
}

buildProduction().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
