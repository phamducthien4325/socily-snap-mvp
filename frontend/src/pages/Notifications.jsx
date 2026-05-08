import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, UserPlus, Heart, MessageCircle, Users, Loader2, BellOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const API = 'http://localhost:5000/api';

const NOTIF_ICONS = {
  connection: { icon: UserPlus, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  like: { icon: Heart, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  comment: { icon: MessageCircle, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  group: { icon: Users, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  default: { icon: Bell, color: 'var(--primary)', bg: 'var(--primary-light)' }
};

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(timestamp).toLocaleDateString('vi-VN');
}

export default function Notifications() {
  const { setUnreadNotifications } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [markingAll, setMarkingAll] = useState(false);

  const token = localStorage.getItem('socily_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/notifications`, { headers });
      setNotifications(res.data.notifications || []);
      // Cập nhật badge count
      const unread = (res.data.notifications || []).filter(n => !n.read).length;
      setUnreadNotifications(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Lắng nghe realtime notifications
    const handleNewNotification = () => {
      fetchNotifications();
    };
    window.addEventListener('new_notification_received', handleNewNotification);
    return () => window.removeEventListener('new_notification_received', handleNewNotification);
  }, [fetchNotifications]);

  const handleMarkRead = async (notifId) => {
    try {
      await axios.put(`${API}/notifications/${notifId}/read`, {}, { headers });
      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, read: true } : n)
      );
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await axios.put(`${API}/notifications/read-all`, {}, { headers });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifications(0);
    } catch (error) {
      console.error('Mark all read error:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (notifId) => {
    try {
      await axios.delete(`${API}/notifications/${notifId}`, { headers });
      setNotifications(prev => {
        const removed = prev.find(n => n.id === notifId);
        if (removed && !removed.read) {
          setUnreadNotifications(p => Math.max(0, p - 1));
        }
        return prev.filter(n => n.id !== notifId);
      });
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.read) {
      await handleMarkRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  // Filter
  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const filters = [
    { key: 'all', label: 'Tất cả', count: notifications.length },
    { key: 'unread', label: 'Chưa đọc', count: unreadCount },
    { key: 'read', label: 'Đã đọc', count: notifications.length - unreadCount },
  ];

  return (
    <div className="col-main">
      {/* Header */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'var(--primary-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Bell size={22} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Thông báo</h2>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
              </span>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '10px',
                background: 'var(--primary-light)', color: 'var(--primary)',
                border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                opacity: markingAll ? 0.6 : 1, transition: 'all 0.2s'
              }}
            >
              {markingAll ? <Loader2 size={14} className="spin" /> : <CheckCheck size={14} />}
              Đọc tất cả
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 16px', borderRadius: '20px', border: 'none',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
                background: filter === f.key ? 'var(--primary)' : 'var(--background)',
                color: filter === f.key ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {f.label}
              {f.count > 0 && (
                <span style={{
                  marginLeft: '6px', padding: '1px 7px', borderRadius: '10px',
                  fontSize: '11px', fontWeight: 700,
                  background: filter === f.key ? 'rgba(255,255,255,0.25)' : 'var(--border-color)',
                  color: filter === f.key ? '#fff' : 'var(--text-secondary)',
                }}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--primary)', margin: '0 auto' }} />
          <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>Đang tải thông báo...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'var(--background)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <BellOff size={28} color="var(--text-secondary)" />
          </div>
          <p style={{ fontWeight: 600, fontSize: '16px', marginBottom: '6px' }}>
            {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Các hoạt động liên quan đến bạn sẽ xuất hiện ở đây
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <AnimatePresence>
            {filtered.map((notif, index) => {
              const typeConfig = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default;
              const IconComponent = typeConfig.icon;

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '16px 20px', cursor: 'pointer',
                    borderBottom: index < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                    background: notif.read ? 'transparent' : 'rgba(224, 79, 22, 0.03)',
                    transition: 'background 0.2s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (notif.read) e.currentTarget.style.background = 'var(--background)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(224, 79, 22, 0.03)'; }}
                >
                  {/* Unread indicator */}
                  {!notif.read && (
                    <div style={{
                      position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)',
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'var(--primary)'
                    }} />
                  )}

                  {/* Actor avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar src={notif.actor?.avatar} fallback={notif.actor?.username} size="md" />
                    <div style={{
                      position: 'absolute', bottom: '-2px', right: '-2px',
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: typeConfig.bg, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      border: '2px solid var(--surface)'
                    }}>
                      <IconComponent size={11} color={typeConfig.color} />
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 700 }}>@{notif.actor?.username || 'someone'}</span>
                      {' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{notif.content}</span>
                    </div>
                    <div style={{
                      fontSize: '12px', color: 'var(--text-secondary)',
                      marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      <span>{timeAgo(notif.timestamp)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{ display: 'flex', gap: '4px', flexShrink: 0 }}
                    onClick={e => e.stopPropagation()}
                  >
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        title="Đánh dấu đã đọc"
                        style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-secondary)', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      title="Xoá thông báo"
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-secondary)', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#EF4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

