const fs = require('fs');
const text = fs.readFileSync('C:\\Users\\Trabalho\\.gemini\\antigravity\\brain\\74c3618f-b833-494d-8563-9644889cc9ba\\.system_generated\\steps\\20\\content.md', 'utf8');
const regex = /https:\/\/[^\s"'()]+\.(?:png|jpg|svg)/g;
const matches = [...new Set(text.match(regex))].filter(Boolean);
matches.forEach(m => console.log(m));
