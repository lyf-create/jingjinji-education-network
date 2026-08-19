import { readFile, writeFile } from 'node:fs/promises';

const source = await readFile('assets/collaboration-index-source.html', 'utf8');
const style = source.match(/<style>([\s\S]*?)<\/style>/)[1];
const body = source.match(/<body[^>]*>([\s\S]*?)<script/)[1];
const scripts = [...source.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const code = scripts.at(-1)[1];
await writeFile('assets/collaboration-index-source.js', `window.CollaborationIndexSource=${JSON.stringify({ style, body, code })};\n`);
