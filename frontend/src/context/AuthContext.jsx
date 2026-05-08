import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:5000/api/auth';
const SOCKET_URL = 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Khôi phục phiên đăng nhập từ localStorage khi khởi động
  useEffect(() => {
    const savedToken = localStorage.getItem('socily_token');
    const savedUser = localStorage.getItem('socily_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Cấu hình axios mặc định gửi kèm token
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  // Quản lý Socket Connection
  useEffect(() => {
    let newSocket;
    if (user && !socket) {
      newSocket = io(SOCKET_URL);
      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('register', user.id);
      });

      newSocket.on('new_notification', (notification) => {
        setUnreadNotifications(prev => prev + 1);
        // Có thể dispatch một event hoặc trigger toast notification ở đây
        const event = new CustomEvent('new_notification_received', { detail: notification });
        window.dispatchEvent(event);
      });
    }

    return () => {
      if (newSocket) newSocket.close();
    };
  }, [user]);

  // Fetch initial notifications count
  useEffect(() => {
    if (user && token) {
      axios.get('http://localhost:5000/api/notifications')
        .then(res => {
          const unread = res.data.notifications.filter(n => !n.read).length;
          setUnreadNotifications(unread);
        })
        .catch(err => console.error('Error fetching notifications:', err));
    }
  }, [user, token]);

  const login = async (username, password) => {
    const res = await axios.post(`${API_URL}/login`, { username, password });
    const { token: newToken, user: userData } = res.data;
    
    localStorage.setItem('socily_token', newToken);
    localStorage.setItem('socily_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  // Bước 1: Gửi OTP đến email
  const sendOTP = async (username, email, password) => {
    const res = await axios.post(`${API_URL}/send-otp`, { username, email, password });
    return res.data;
  };

  // Bước 2: Xác thực OTP và tạo tài khoản
  const verifyOTP = async (email, otp) => {
    const res = await axios.post(`${API_URL}/verify-otp`, { email, otp });
    const { token: newToken, user: userData } = res.data;

    localStorage.setItem('socily_token', newToken);
    localStorage.setItem('socily_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    setToken(newToken);
    setUser(userData);
    return userData;
  };

  // Gửi lại OTP
  const resendOTP = async (email) => {
    const res = await axios.post(`${API_URL}/resend-otp`, { email });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('socily_token');
    localStorage.removeItem('socily_user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, login, sendOTP, verifyOTP, resendOTP, logout,
      socket, unreadNotifications, setUnreadNotifications 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
