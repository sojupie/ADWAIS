const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/ollem/Git/motillo project/dashboard/lighthouseResult.json', 'utf8'));
const failing = Object.values(data.audits).filter(a => a.score !== null && a.score < 0.9);
failing.forEach(a => console.log(a.id + ': ' + a.score + ' - ' + a.title));
