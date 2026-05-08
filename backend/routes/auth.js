const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { getGraph } = require('../db');

const router = express.Router();

// ============================================================
// Cấu hình Nodemailer (sử dụng Gmail App Password hoặc SMTP)
// ============================================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''    // Gmail App Password (16 ký tự)
    }
});

// Lưu OTP tạm thời trong memory (production nên dùng Redis/DB)
const otpStore = new Map();

// Hàm tạo OTP 6 chữ số
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hàm dọn dẹp OTP hết hạn
function cleanupExpiredOTPs() {
    const now = Date.now();
    for (const [key, value] of otpStore.entries()) {
        if (now > value.expiresAt) {
            otpStore.delete(key);
        }
    }
}

// Dọn dẹp OTP mỗi 5 phút
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

// ============================================================
// API: Gửi OTP đến email
// ============================================================
router.post('/send-otp', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ username, email và password.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email không hợp lệ.' });
        }

        const graph = getGraph();

        // Kiểm tra username đã tồn tại
        const checkUser = await graph.query(
            `MATCH (u:User {username: $username}) RETURN u`,
            { params: { username } }
        );
        if (checkUser.data.length > 0) {
            return res.status(400).json({ error: 'Tên đăng nhập đã được sử dụng.' });
        }

        // Kiểm tra email đã tồn tại
        const checkEmail = await graph.query(
            `MATCH (u:User {email: $email}) RETURN u`,
            { params: { email } }
        );
        if (checkEmail.data.length > 0) {
            return res.status(400).json({ error: 'Email này đã được đăng ký.' });
        }

        // Tạo OTP
        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

        // Hash password trước khi lưu tạm
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Lưu OTP kèm thông tin đăng ký
        otpStore.set(email, {
            otp,
            username,
            hashedPassword,
            expiresAt,
            attempts: 0
        });

        // Gửi email OTP
        const mailOptions = {
            from: `"Socily" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Mã xác thực OTP - Socily',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 24px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="color: #E04F16; font-size: 28px; margin: 0;">Socily</h1>
                        <p style="color: #6B7280; font-size: 14px; margin-top: 8px;">Xác thực tài khoản của bạn</p>
                    </div>
                    
                    <div style="background: #F9FAFB; border-radius: 16px; padding: 32px; text-align: center; border: 1px solid #E5E7EB;">
                        <p style="color: #374151; font-size: 15px; margin-bottom: 24px;">
                            Xin chào <strong>${username}</strong>, đây là mã OTP của bạn:
                        </p>
                        <div style="background: #fff; border: 2px dashed #E04F16; border-radius: 12px; padding: 20px; display: inline-block;">
                            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #E04F16;">${otp}</span>
                        </div>
                        <p style="color: #9CA3AF; font-size: 13px; margin-top: 24px;">
                            Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này với bất kỳ ai.
                        </p>
                    </div>
                    
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 32px;">
                        Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}: ${otp}`);

        res.json({ message: 'Mã OTP đã được gửi đến email của bạn.' });
    } catch (error) {
        console.error('Send OTP error:', error);
        
        // Xử lý lỗi gửi email cụ thể
        if (error.code === 'EAUTH' || error.responseCode === 535) {
            return res.status(500).json({ error: 'Lỗi cấu hình email server. Vui lòng liên hệ admin.' });
        }
        
        res.status(500).json({ error: 'Không thể gửi OTP. Vui lòng thử lại sau.' });
    }
});

// ============================================================
// API: Xác thực OTP và tạo tài khoản
// ============================================================
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Vui lòng nhập email và mã OTP.' });
        }

        const stored = otpStore.get(email);

        if (!stored) {
            return res.status(400).json({ error: 'Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng gửi lại.' });
        }

        // Kiểm tra hết hạn
        if (Date.now() > stored.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ error: 'Mã OTP đã hết hạn. Vui lòng gửi lại.' });
        }

        // Giới hạn số lần thử (tối đa 5)
        if (stored.attempts >= 5) {
            otpStore.delete(email);
            return res.status(400).json({ error: 'Đã vượt quá số lần thử. Vui lòng gửi lại mã mới.' });
        }

        // Kiểm tra OTP
        if (stored.otp !== otp.toString()) {
            stored.attempts += 1;
            return res.status(400).json({ 
                error: `Mã OTP không đúng. Còn ${5 - stored.attempts} lần thử.` 
            });
        }

        // OTP đúng → Tạo tài khoản trong FalkorDB
        const graph = getGraph();
        const userId = Date.now().toString();

        const role = stored.username === 'admin' ? 'admin' : 'user';

        const insertQuery = `
            CREATE (u:User {id: $id, username: $username, email: $email, password: $password, verified: true, role: $role})
            RETURN u
        `;
        await graph.query(insertQuery, {
            params: {
                id: userId,
                username: stored.username,
                email: email,
                password: stored.hashedPassword,
                role: role
            }
        });

        // Xóa OTP sau khi dùng
        otpStore.delete(email);

        // Tạo JWT token và tự động đăng nhập
        const token = jwt.sign(
            { id: userId, username: stored.username, role },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '1d' }
        );

        res.status(201).json({
            message: 'Đăng ký thành công!',
            token,
            user: { id: userId, username: stored.username, email, role }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Lỗi server. Vui lòng thử lại.' });
    }
});

// ============================================================
// API: Gửi lại OTP
// ============================================================
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Vui lòng cung cấp email.' });
        }

        const stored = otpStore.get(email);
        if (!stored) {
            return res.status(400).json({ error: 'Không tìm thấy phiên đăng ký. Vui lòng bắt đầu lại.' });
        }

        // Tạo OTP mới
        const newOtp = generateOTP();
        stored.otp = newOtp;
        stored.expiresAt = Date.now() + 5 * 60 * 1000;
        stored.attempts = 0;

        // Gửi lại email
        const mailOptions = {
            from: `"Socily" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Mã xác thực OTP mới - Socily',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 24px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="color: #E04F16; font-size: 28px; margin: 0;">Socily</h1>
                        <p style="color: #6B7280; font-size: 14px; margin-top: 8px;">Mã xác thực mới</p>
                    </div>
                    <div style="background: #F9FAFB; border-radius: 16px; padding: 32px; text-align: center; border: 1px solid #E5E7EB;">
                        <p style="color: #374151; font-size: 15px; margin-bottom: 24px;">
                            Xin chào <strong>${stored.username}</strong>, đây là mã OTP mới:
                        </p>
                        <div style="background: #fff; border: 2px dashed #E04F16; border-radius: 12px; padding: 20px; display: inline-block;">
                            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #E04F16;">${newOtp}</span>
                        </div>
                        <p style="color: #9CA3AF; font-size: 13px; margin-top: 24px;">
                            Mã có hiệu lực trong <strong>5 phút</strong>.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP resent to ${email}: ${newOtp}`);

        res.json({ message: 'Mã OTP mới đã được gửi.' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'Không thể gửi lại OTP.' });
    }
});

// ============================================================
// Login Route (giữ nguyên)
// ============================================================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const graph = getGraph();

        const query = `MATCH (u:User {username: $username}) RETURN u.id AS id, u.username AS username, u.password AS password, u.role AS role`;
        const result = await graph.query(query, { params: { username } });
        
        console.log('Login query result:', JSON.stringify(result.data));

        if (result.data.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const row = result.data[0];
        const user = {
            id: row.id || row[0],
            username: row.username || row[1],
            password: row.password || row[2],
            role: row.role || row[3] || 'user' // Default to user if not set
        };
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role }, 
            process.env.JWT_SECRET || 'secretkey', 
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
