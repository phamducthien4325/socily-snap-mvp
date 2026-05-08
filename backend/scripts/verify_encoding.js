const fs = require('fs');
const content = fs.readFileSync('../frontend/src/components/TopNav.jsx', 'utf8');
const match = content.match(/placeholder="([^"]+)"/);
if (match) console.log('Placeholder:', match[1]);

// Check some Vietnamese strings
const tests = ['Tìm kiếm', 'Tạo bài', 'Tạo Group', 'người dùng'];
for (const t of tests) {
    const found = content.includes(t);
    console.log(`"${t}": ${found ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
}
