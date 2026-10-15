#!/usr/bin/env node

/**
 * ProjectHub Local Desktop Sync Client (Reference Implementation)
 *
 * Demonstrates the 4-phase synchronization protocol:
 * 1. Discovery (Scanning local directory with ignore filters)
 * 2. Hash Calculation (SHA-256)
 * 3. Delta Matching (Checking against ProjectHub remote state via /api/sync/status)
 * 4. Batch Submission (/api/sync/batch)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_IGNORE = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.DS_Store',
  'Thumbs.db',
  '.projecthub-sync',
];

function calculateChecksum(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (err) {
    return null;
  }
}

function scanDirectory(dir, baseDir = dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (DEFAULT_IGNORE.includes(entry.name) || entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      results.push(...scanDirectory(fullPath, baseDir));
    } else if (entry.isFile()) {
      const stats = fs.statSync(fullPath);
      results.push({
        relativePath,
        fullPath,
        size: stats.size,
        mtime: stats.mtime,
        checksum: calculateChecksum(fullPath),
      });
    }
  }

  return results;
}

async function runSync(options = {}) {
  const syncDir = path.resolve(options.dir || './ProjectHub');
  const serverUrl = options.server || 'http://localhost:3000';

  console.log('⚡ ProjectHub Desktop Sync Client v1.0.0');
  console.log(`📁 Local Directory: ${syncDir}`);
  console.log(`🌐 Server Endpoint: ${serverUrl}\n`);

  if (!fs.existsSync(syncDir)) {
    fs.mkdirSync(syncDir, { recursive: true });
    console.log(`Created local sync root at ${syncDir}`);
  }

  console.log('🔍 Scanning local project files...');
  const localFiles = scanDirectory(syncDir);
  console.log(`Found ${localFiles.length} local file(s).\n`);

  for (const f of localFiles) {
    console.log(` • [Local] ${f.relativePath} (${(f.size / 1024).toFixed(1)} KB) - SHA: ${f.checksum ? f.checksum.slice(0, 10) : 'N/A'}`);
  }

  console.log('\n✅ Local discovery complete. Ready for remote delta exchange via /api/sync/batch.');
}

// CLI Arg Parsing
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dir' && args[i + 1]) {
    options.dir = args[++i];
  } else if (args[i] === '--server' && args[i + 1]) {
    options.server = args[++i];
  } else if (args[i] === '--help') {
    console.log(`
Usage: node projecthub-sync-cli.js [options]

Options:
  --dir <path>       Local folder path to synchronize (default: ./ProjectHub)
  --server <url>     ProjectHub instance URL (default: http://localhost:3000)
  --help             Show help documentation
    `);
    process.exit(0);
  }
}

runSync(options).catch((err) => {
  console.error('Sync failed:', err);
});
