import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Eye, EyeOff, Mail, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';

export default function Register() {
  // Step 1 state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 (OTP) state
  const [step, setStep] = useState(1); // 1 = form đăng ký, 2 = nhập OTP
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  // Common state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  const { sendOTP, verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();

  // Countdown timer cho nút gửi lại OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus vào ô OTP đầu tiên khi chuyển sang step 2
  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0].focus(), 100);
    }
  }, [step]);

  // ==================== STEP 1: Gửi OTP ====================
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !email || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email không hợp lệ.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    try {
      await sendOTP(username, email, password);
      setStep(2);
      setCountdown(60);
      setSuccess('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Không thể gửi OTP. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== STEP 2: Xác thực OTP ====================
  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOTP(email, otp);
      navigate('/feed');
    } catch (err) {
      const msg = err.response?.data?.error || 'Xác thực thất bại. Vui lòng thử lại.';
      setError(msg);
      // Reset OTP fields khi sai
      setOtpDigits(['', '', '', '', '', '']);
      if (otpRefs.current[0]) otpRefs.current[0].focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý nhập từng ô OTP
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Chỉ cho nhập số

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1); // Chỉ lấy 1 ký tự
    setOtpDigits(newDigits);

    // Tự động focus sang ô tiếp theo
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Tự động submit khi nhập đủ 6 số
    if (index === 5 && value) {
      const fullOtp = newDigits.join('');
      if (fullOtp.length === 6) {
        // Delay nhỏ để UI cập nhật
        setTimeout(() => {
          handleVerifyOTP();
        }, 200);
      }
    }
  };

  // Xử lý phím Backspace trong ô OTP
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Xử lý paste OTP
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      // Focus ô cuối cùng có giá trị
      const lastIndex = Math.min(pasted.length, 5);
      otpRefs.current[lastIndex]?.focus();

      if (pasted.length === 6) {
        setTimeout(() => handleVerifyOTP(), 200);
      }
    }
  };

  // Gửi lại OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setResending(true);
    setError('');
    try {
      await resendOTP(email);
      setCountdown(60);
      setSuccess('Mã OTP mới đã được gửi đến email của bạn.');
      setOtpDigits(['', '', '', '', '', '']);
      if (otpRefs.current[0]) otpRefs.current[0].focus();
    } catch (err) {
      const msg = err.response?.data?.error || 'Không thể gửi lại OTP.';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  // Quay lại step 1
  const handleBackToForm = () => {
    setStep(1);
    setError('');
    setSuccess('');
    setOtpDigits(['', '', '', '', '', '']);
  };

  // ==================== INPUT STYLE ====================
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    fontSize: '15px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    background: 'var(--background)',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontWeight: 600,
    fontSize: '14px',
    marginBottom: '8px',
    color: 'var(--text-primary)'
  };

  // ==================== RENDER ====================
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background)',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        padding: '48px 40px',
        boxShadow: 'var(--shadow-soft)',
        border: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Progress Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'var(--border-color)'
        }}>
          <div style={{
            height: '100%',
            width: step === 1 ? '50%' : '100%',
            background: 'var(--primary)',
            borderRadius: '0 4px 4px 0',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
        </div>

        {/* ==================== STEP 1: Form đăng ký ==================== */}
        {step === 1 && (
          <>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>Socily</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Tạo tài khoản mới để bắt đầu</p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#FEF2F2', color: '#DC2626', padding: '12px 16px',
                borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: 500
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSendOTP}>
              {/* Username */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Tên đăng nhập</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Chọn tên đăng nhập..."
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(224, 79, 22, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} /> Email
                  </span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(224, 79, 22, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự..."
                    style={{ ...inputStyle, paddingRight: '48px' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(224, 79, 22, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '28px' }}>
                <label style={labelStyle}>Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(224, 79, 22, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-full"
                style={{ padding: '14px', fontSize: '16px', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {isLoading ? (
                  <span>Đang gửi mã OTP...</span>
                ) : (
                  <>
                    <Mail size={18} />
                    Gửi mã xác thực
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <p style={{ textAlign: 'center', marginTop: '28px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Đã có tài khoản?{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                Đăng nhập
              </Link>
            </p>
          </>
        )}

        {/* ==================== STEP 2: Nhập OTP ==================== */}
        {step === 2 && (
          <>
            {/* Back Button */}
            <button
              onClick={handleBackToForm}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500,
                marginBottom: '24px', padding: 0
              }}
            >
              <ArrowLeft size={16} /> Quay lại
            </button>

            {/* OTP Icon */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '20px',
                background: 'linear-gradient(135deg, #E04F16 0%, #F97316 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 8px 24px rgba(224, 79, 22, 0.3)'
              }}>
                <ShieldCheck size={36} color="#fff" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                Xác thực Email
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                Chúng tôi đã gửi mã 6 chữ số đến<br />
                <strong style={{ color: 'var(--primary)' }}>{email}</strong>
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div style={{
                background: '#F0FDF4', color: '#16A34A', padding: '12px 16px',
                borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: 500,
                textAlign: 'center'
              }}>
                {success}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: '#FEF2F2', color: '#DC2626', padding: '12px 16px',
                borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: 500,
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            {/* OTP Input Boxes */}
            <form onSubmit={handleVerifyOTP}>
              <div style={{
                display: 'flex', gap: '10px', justifyContent: 'center',
                marginBottom: '32px'
              }}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => otpRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    style={{
                      width: '52px',
                      height: '60px',
                      textAlign: 'center',
                      fontSize: '24px',
                      fontWeight: 700,
                      borderRadius: '14px',
                      border: digit
                        ? '2px solid var(--primary)'
                        : '2px solid var(--border-color)',
                      background: digit ? 'rgba(224, 79, 22, 0.04)' : 'var(--background)',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: 'var(--text-primary)',
                      transition: 'all 0.2s ease',
                      caretColor: 'var(--primary)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(224, 79, 22, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = digit ? 'var(--primary)' : 'var(--border-color)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpDigits.join('').length !== 6}
                className="btn btn-primary btn-full"
                style={{
                  padding: '14px', fontSize: '16px',
                  opacity: (isLoading || otpDigits.join('').length !== 6) ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                {isLoading ? (
                  <span>Đang xác thực...</span>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Xác nhận & Đăng ký
                  </>
                )}
              </button>
            </form>

            {/* Resend OTP */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                Không nhận được mã?
              </p>
              <button
                onClick={handleResendOTP}
                disabled={countdown > 0 || resending}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: countdown > 0 ? 'default' : 'pointer',
                  color: countdown > 0 ? 'var(--text-secondary)' : 'var(--primary)',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'inherit'
                }}
              >
                <RefreshCw size={14} style={{
                  animation: resending ? 'spin 1s linear infinite' : 'none'
                }} />
                {resending
                  ? 'Đang gửi...'
                  : countdown > 0
                    ? `Gửi lại sau ${countdown}s`
                    : 'Gửi lại mã OTP'
                }
              </button>
            </div>
          </>
        )}
      </div>

      {/* Spin animation for resend icon */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
