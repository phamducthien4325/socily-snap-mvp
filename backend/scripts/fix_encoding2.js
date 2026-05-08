/**
 * Script sửa tất cả chuỗi tiếng Việt bị lỗi encoding còn lại
 * Bổ sung thêm nhiều patterns
 */
const fs = require('fs');
const path = require('path');

const replacements = [
    // --- App.jsx ---
    ['\uFFFD\x1D ', '— '],
    
    // --- InviteModal.jsx ---
    ['\uFFFD\x18\u1ED2 g\u1EE3i \u00FD', '\u0111\u1EC3 g\u1EE3i \u00FD'],  // để gợi ý
    ['kh\u00F4ng c\u00F3 b\u1EA1n b\u00E8 n\u00E0o \uFFFD\x18\u1ED2', 'kh\u00F4ng c\u00F3 b\u1EA1n b\u00E8 n\u00E0o \u0111\u1EC3'],  // không có bạn bè nào để
    
    // --- LeftSidebar.jsx ---
    ['component m\uFFFD:i 3 b\u01B0\uFFFD:c', 'component m\u1EDBi 3 b\u01B0\u1EDBc'],
    
    // --- CreatePost.jsx ---
    ['ch\u1ECDn m\uFFFD"t c\u1ED9ng \u0111\u1ED3ng tr\u01B0\uFFFD:c khi \uFFFD\x18\u0112ng', 'ch\u1ECDn m\u1ED9t c\u1ED9ng \u0111\u1ED3ng tr\u01B0\u1EDBc khi \u0111\u0103ng'],
    ['nh\u1EADp ti\u00EAu \uFFFD\x18\u1EC1 ho\u1EB7c n\u1ED9i dung', 'nh\u1EADp ti\u00EAu \u0111\u1EC1 ho\u1EB7c n\u1ED9i dung'],
    ['xảy ra l\uFFFD\x14i khi đăng bài', 'xảy ra lỗi khi đăng bài'],
    ['xảy ra l\uFFFD\x14i', 'xảy ra lỗi'],
    ['Ti\u00EAu \uFFFD\x18\u1EC1', 'Tiêu đề'],
    ['ti\u00EAu \uFFFD\x18\u1EC1', 'tiêu đề'],
    ['Đ\u0112ng b\uFFFDxi', 'Đăng bài'],
    ['\u0110\u0112ng b\uFFFDxi', 'Đăng bài'],
    ['ĐĒng b\uFFFDxi', 'Đăng bài'],
    ['Đ\u0112ng b\u00E0i', 'Đăng bài'],
    ['\uFFFDx\x1C9 Quy t\u1EAFc', '📋 Quy tắc'],
    ['N\uFFFD"i dung ph\u1EA3i', 'Nội dung phải'],
    ['c\u1ED9ng \u0111\u1ED3ng \uFFFD\x18\u00E3 ch\u1ECDn', 'cộng đồng đã chọn'],
    ['đ\u0112ng', 'đăng'],
    
    // --- Discover.jsx ---
    ['c\u1ED9ng \u0111\u1ED3ng m\uFFFD:i', 'cộng đồng mới'],
    ['Lý do đề xuất:', 'Lý do đề xuất:'],
    ['=e ', '👥 '],
    ['\u003C\uFFFD \u0010i\u1EC3m chung:', '🎯 Điểm chung:'],
    ['\u0110\u00E3 k\u1EBFt n\uFFFD\x18i', 'Đã kết nối'],
    ['K\u1EBFt n\uFFFD\x18i', 'Kết nối'],
    ['k\u1EBFt n\uFFFD\x18i', 'kết nối'],
    ['\u003C\uFFFD', '🎯'],
    
    // --- GraphDashboard.jsx ---
    ['Layout ri\u00EAng bi\uFFFD!t', 'Layout riêng biệt'],
    ['\uFFFD\x1D Layout', '— Layout'],
    
    // Generic remaining patterns
    ['b\uFFFD\x18i', 'bối'],
    ['l\uFFFD\x14i', 'lỗi'],
    ['m\uFFFD:i', 'mới'],
    ['m\uFFFD"t', 'một'],
    ['tr\u01B0\uFFFD:c', 'trước'],
    ['\uFFFD\x18\u0112ng', 'đăng'],
    ['\uFFFD\x18\u1ED2', 'để'],
    ['\uFFFD\x18\u00E3', 'đã'],
    ['\uFFFD\x18ã', 'đã'],
    ['r\uFFFD\x1Ci', 'rồi'],
    ['s\uFFFDx', 'sở'],
    ['h\uFFFD"i', 'hội'],
    ['li\uFFFD!u', 'liệu'],
    ['li\uFFFD!t', 'liệt'],
    ['hi\uFFFD!n', 'hiện'],
    ['hi\uFFFD!u', 'hiệu'],
    ['b\uFFFD9', 'bị'],
    ['n\uFFFD\x18i', 'nối'],
    ['th\uFFFD9', 'thị'],
    ['b\u01B0\uFFFD:c', 'bước'],
    
    // Fix emoji garbage
    ['\uFFFDx}', '🎮'],
    ['\uFFFDa', '⚽'],
    ['⭐', '⭐'],
];

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changeCount = 0;
    
    for (const [bad, good] of replacements) {
        if (content.includes(bad)) {
            const count = content.split(bad).length - 1;
            content = content.split(bad).join(good);
            changeCount += count;
        }
    }
    
    if (changeCount > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        return changeCount;
    }
    return 0;
}

function getAllFiles(dir) {
    let results = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && item !== 'node_modules' && item !== 'dist') {
            results = results.concat(getAllFiles(fullPath));
        } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
            results.push(fullPath);
        }
    }
    return results;
}

const srcDir = path.join(__dirname, '..', '..', 'frontend', 'src');
const files = getAllFiles(srcDir);

let totalFixed = 0;
for (const f of files) {
    const count = fixFile(f);
    if (count > 0) {
        console.log(`✅ ${path.relative(srcDir, f)}: ${count} replacements`);
        totalFixed++;
    }
}

console.log(`\nDone! ${totalFixed} files fixed.`);

// Check remaining
console.log('\n--- Remaining FFFD ---');
let remaining = 0;
for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('\uFFFD')) {
            console.log(`  ${path.relative(srcDir, f)}:${i+1}: ${lines[i].trim().substring(0,120)}`);
            remaining++;
        }
    }
}
console.log(`Total remaining issues: ${remaining}`);
