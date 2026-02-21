#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Spawn Next.js dev server
const nextProcess = spawn('node', [path.join(__dirname, '../node_modules/next/dist/bin/next'), 'dev'], {
  shell: true,
});

// Pipe stdout
nextProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

// Filter stderr to suppress source map warnings
nextProcess.stderr.on('data', (data) => {
  const message = data.toString();
  if (
    !message.includes('Failed to parse source map') ||
    !message.includes('mappings.wasm')
  ) {
    process.stderr.write(data);
  }
});

nextProcess.on('exit', (code) => {
  process.exit(code || 0);
});
