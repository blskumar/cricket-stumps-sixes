// Assembles src/ into index.html (one self-contained page, no dependencies).
const fs = require('fs'), path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const js = ['01-utils-audio.js','02-field-and-shots.js','03-match-engine.js','04-render.js','05-ui-and-input.js'].map(src).join('');
const page = src('page.html');
const i = page.indexOf('<style>'), j = page.indexOf('</style>') + 8;
const head = page.slice(0, i), style = page.slice(i, j), body = page.slice(j);
const title = head.slice(head.indexOf('<title>'), head.indexOf('</title>') + 8);
const fonts = head.match(/<link rel="stylesheet"[^>]+>/)[0];
const out = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + title + '\n' + fonts + '\n' + style +
  '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}</style>\n</head>\n<body>\n' +
  body + '\n<script>\n' + js + '</script>\n</body>\n</html>\n';
fs.writeFileSync(path.join(__dirname, 'index.html'), out);
console.log('built index.html', out.length, 'bytes');
