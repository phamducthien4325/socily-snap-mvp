/**
 * Script sửa lỗi encoding tiếng Việt bị hỏng
 * Chiến lược: Tìm & thay thế trực tiếp các chuỗi bị lỗi bằng text đúng
 */

const fs = require('fs');
const path = require('path');

// Map các chuỗi bị lỗi -> chuỗi đúng
// Tìm thông qua ngữ cảnh xung quanh
const replacements = [
    // TopNav.jsx
    ['T\uFFFDo Group', 'Tạo Group'],
    ['T\uFFFDo bài', 'Tạo bài'],
    ['\u0110\u0112ng xu\u1EA5t', 'Đăng xuất'],
    ['Đ\u0112ng xu\u1EA5t', 'Đăng xuất'],
    ['Th\u00F4ng b\u00E1o', 'Thông báo'], // already correct, skip
    
    // Feed.jsx - fix leading garbage
    ['\uFFFDimport React', 'import React'],
    ['B\u1EA1n \uFFFD\x18ã share', 'Bạn đã share'],
    ['bài viết này r\uFFFD\x1ci', 'bài viết này rồi'],
    ['\uFFFDx\x1D\uFFFD Recommended', '⭐ Recommended'],
    ['\uFFFDx\x1C\uFFFD ', '🏷️ '],
    ['}\u003E\uFFFDx\x1D\x14\u003C', '}\u003E🔗\u003C'],
    
    // GraphDashboard.jsx
    ['Kh\u00F4ng th\u1ED2 t\u1EA3i d\u1EEF li\uFFFD!u', 'Không thể tải dữ liệu'],
    ['Đang tải \uFFFD\x18\uFFFD\x1C th\uFFFD9', 'Đang tải đồ thị'],
    ['Ch\u01B0a c\u00F3 d\u1EEF li\uFFFD!u', 'Chưa có dữ liệu'],
    ['ch\u1EA1y Benchmark tr\u01B0\uFFFD:c', 'chạy Benchmark trước'],
    ['S\uFFFDx th\u00EDch ph\uFFFD" bi\u1EBFn', 'Sở thích phổ biến'],
    ['C\uFFFD"ng \uFFFD\x18\uFFFD\x1Cng theo Interest', 'Cộng đồng theo Interest'],
    ['G\u1EE3i \u00FD C\uFFFD"ng \uFFFD\x18\uFFFD\x1Cng', 'Gợi ý Cộng đồng'],
    ['quan h\uFFFD! ng\u1EABu nhi\u00EAn', 'quan hệ ngẫu nhiên'],
    ['sau \uFFFD\x18\u00F3 \uFFFD\x18o th\u1EDDi gian', 'sau đó đo thời gian'],
    ['So s\u00E1nh v\uFFFD:i SQL', 'So sánh với SQL'],
    ['t\u01B0\u01A1ng \uFFFD\x18\u01B0\u01A1ng', 'tương đương'],
    ['\uFFFDx\x1C\uFFFD Seed Data', '📊 Seed Data'],
    ['Layout ri\u00EAng bi\uFFFD!t', 'Layout riêng biệt'],
    ['\uFFFDx\x1D\uFFFD Graph Database', '📊 Graph Database'],
    ['ph\u00E2n t\u00EDch hi\uFFFD!u su\u1EA5t', 'phân tích hiệu suất'],
    ['m\u1EA1ng x\u00E3 h\uFFFD"i', 'mạng xã hội'],
    
    // Group.jsx
    ['c\uFFFD"ng \uFFFD\x18\uFFFD\x1Cng', 'cộng đồng'],
    ['C\uFFFD"ng \uFFFD\x18\uFFFD\x1Cng', 'Cộng đồng'],
    ['Kh\u00F4ng \uFFFD\x18\u01B0\u1EE3c', 'Không được'],
    ['kh\u00F4ng \uFFFD\x18\u01B0\u1EE3c', 'không được'],
    ['qu\u1EA5y r\uFFFD\x18i', 'quấy rối'],
    ['\uFFFD\x18e d\u1ECDa', 'đe dọa'],
    ['\uFFFD\x18\u0112ng n\uFFFD"i dung', 'đăng nội dung'],
    ['N\uFFFD"i dung ph\u00F9 h\u1EE3p', 'Nội dung phù hợp'],
    ['n\uFFFD"i dung', 'nội dung'],
    ['li\u00EAn quan \uFFFD\x18\u1EBFn ch\u1EE7 \uFFFD\x18\u1EC1', 'liên quan đến chủ đề'],
    ['T\uFFFD\x18t nh\u1EA5t', 'Tốt nhất'],
    ['M\uFFFD:i nh\u1EA5t', 'Mới nhất'],
    ['ng\u01B0\u1EDDi \uFFFD\x18\u1EA7u ti\u00EAn', 'người đầu tiên'],
    ['\uFFFD\x18\u0112ng b\u00E0i', 'đăng bài'],
    ['Đ\u0112ng bài', 'Đăng bài'],
    ['Th\uFFFD\x18ng k\u00EA', 'Thống kê'],
    ['Ch\u1EE7 \uFFFD\x18\u1EC1', 'Chủ đề'],
    ['ch\u1EE7 \uFFFD\x18\u1EC1', 'chủ đề'],
    ['\uFFFDx\x1D\x14', '🔗'],
    ['Tu\u1EA7n qua', 'Tuần qua'],
    
    // Notifications.jsx
    ['ph\u00FAt tr\u01B0\uFFFD:c', 'phút trước'],
    ['gi\u1EDD tr\u01B0\uFFFD:c', 'giờ trước'],
    ['ng\u00E0y tr\u01B0\uFFFD:c', 'ngày trước'],
    ['Ch\u01B0a \uFFFD\x18\u1ECDc', 'Chưa đọc'],
    ['ch\u01B0a \uFFFD\x18\u1ECDc', 'chưa đọc'],
    ['Đã \uFFFD\x18\u1ECDc', 'Đã đọc'],
    ['\uFFFD\x18ã \uFFFD\x18\u1ECDc', 'đã đọc'],
    ['th\u00F4ng b\u00E1o m\uFFFD:i', 'thông báo mới'],
    ['ho\u1EA1t \uFFFD\x18\uFFFD"ng', 'hoạt động'],
    ['li\u00EAn quan \uFFFD\x18\u1EBFn', 'liên quan đến'],
    ['xu\u1EA5t hi\uFFFD!n', 'xuất hiện'],
    ['\uFFFDx \uFFFD\x18\u00E2y', 'ở đây'],
    ['Đánh d\u1EA5u \uFFFD\x18ã \uFFFD\x18\u1ECDc', 'Đánh dấu đã đọc'],
    
    // Profile.jsx - might have issues  
    ['Ng\u01B0\u1EDDi theo d\u00F5i', 'Người theo dõi'],
    ['Đang theo d\u00F5i', 'Đang theo dõi'],
    
    // Emoji fixes
    ['\uFFFDx}\uFFFD', '🎮'],  // Gaming
    ['\uFFFDa\uFFFD', '⚽'],    // Sports
    ['\uFFFDx\x19\uFFFD', '💼'],  // Business/Tech/Health
    ['\uFFFD\x1A\uFFFD', '🪙'],   // Crypto
    ['\uFFFDx}R', '🎌'],        // Anime
    ['\uFFFDx}\uFFFD', '🎵'],   // Music
    ['\uFFFDx\x1D\uFFFD', '🔬'], // Science
    ['\uFFFDx\uFFFD"', '🍕'],   // Food
    ['\uFFFDS\uFFFD\uFE0F', '✈️'], // Travel
    ['\uFFFDx\x18\x14', '👗'],  // Fashion
    ['\uFFFDx\x1Ca', '📚'],     // Education
    ['\uFFFDx\x1C\x13', '📕'],  // Books
    ['\uFFFDx\x1C\uFFFD', '📸'], // Photography
    ['\uFFFDxR\uFFFD', '🌿'],   // Nature
    
    // Generic patterns
    ['t\u1ED3n t\u1EA1i', 'tồn tại'],
    ['\uFFFD\x18ã b\uFFFD9 x\u00F3a', 'đã bị xóa'],
    ['ho\u1EB7c kh\u00F4ng t\uFFFD\x1Cn t\u1EA1i', 'hoặc không tồn tại'],
    ['có th\u1ED2', 'có thể'],
];

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changeCount = 0;
    
    for (const [bad, good] of replacements) {
        if (content.includes(bad)) {
            content = content.split(bad).join(good);
            changeCount++;
        }
    }
    
    if (changeCount > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        return changeCount;
    }
    return 0;
}

// Process all files
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

// Verify remaining issues
console.log('\n--- Remaining issues ---');
for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('\uFFFD')) {
            console.log(`⚠️ ${path.relative(srcDir, f)}:${i+1}: ${lines[i].trim().substring(0, 100)}`);
        }
    }
}
