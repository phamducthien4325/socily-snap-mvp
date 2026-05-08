import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronDown, Image as ImageIcon, Link as LinkIcon, AlignLeft, X, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import Avatar from '../components/Avatar';

const API = 'http://localhost:5000/api';

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);

  const pickerRef = useRef(null);
  const titleRef = useRef(null);
  const MAX_CHARS = 2000;

  const token = localStorage.getItem('socily_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get(`${API}/posts/groups`, { headers });
        setGroups(res.data.groups);
      } catch (error) {
        console.error('Error fetching groups', error);
      }
    };
    fetchGroups();
  }, []);

  // Close group picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowGroupPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus title on mount
  useEffect(() => {
    if (titleRef.current) titleRef.current.focus();
  }, []);

  const handleContentChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setContent(val);
      setCharCount(val.length);
    }
  };

  const handlePost = async () => {
    if (!selectedGroup) {
      setError('Vui lòng chọn một cộng đồng trước khi đăng.');
      return;
    }
    if (!content.trim() && !title.trim()) {
      setError('Vui lòng nhập tiêu đề hoặc nội dung.');
      return;
    }
    setError('');
    setPosting(true);
    try {
      const postContent = title.trim() ? `${title.trim()}\n\n${content.trim()}` : content.trim();
      await axios.post(`${API}/posts`, { content: postContent, groupId: selectedGroup }, { headers });
      navigate('/feed');
    } catch (error) {
      console.error('Error posting', error);
      setError('Đã xảy ra lỗi khi đăng bài. Vui lòng thử lại.');
    } finally {
      setPosting(false);
    }
  };

  const selectedComm = groups.find(c => c.id === selectedGroup);
  const filteredGroups = groups.filter(c =>
    c.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const canPost = (content.trim() || title.trim()) && selectedGroup && !posting;



  return (
    <div style={{ maxWidth: '740px', width: '100%', margin: '0 auto', padding: '32px 16px' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '28px', paddingBottom: '16px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
          Tạo bài viết
        </h1>
        <button
          onClick={() => navigate('/feed')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', padding: '6px',
            borderRadius: '50%', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--background)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          title="Hủy bỏ"
        >
          <X size={22} />
        </button>
      </div>

      {/* Group Picker */}
      <div ref={pickerRef} style={{ position: 'relative', marginBottom: '20px' }}>
        <button
          onClick={() => setShowGroupPicker(!showGroupPicker)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 18px', borderRadius: '24px', fontSize: '14px',
            border: selectedComm ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            background: selectedComm ? 'var(--primary-light)' : 'var(--surface)',
            color: selectedComm ? 'var(--primary)' : 'var(--text-secondary)',
            cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
            boxShadow: showGroupPicker ? '0 0 0 2px var(--primary-light)' : 'none'
          }}
        >
          {selectedComm ? (
            <>
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: 'var(--primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700
              }}>c/</span>
              {selectedComm.name}
            </>
          ) : (
            <>
              <Search size={16} />
              Chọn cộng đồng *
            </>
          )}
          <ChevronDown size={14} style={{
            transform: showGroupPicker ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s'
          }} />
        </button>

        {showGroupPicker && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
            background: 'var(--surface)', border: '1px solid var(--border-color)',
            borderRadius: '12px', boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
            width: '320px', maxHeight: '340px', overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            {/* Search within dropdown */}
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--background)', borderRadius: '8px', padding: '8px 12px' }}>
                <Search size={14} color="var(--text-secondary)" />
                <input
                  type="text"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Tìm kiếm cộng đồng..."
                  autoFocus
                  style={{
                    border: 'none', background: 'transparent', outline: 'none',
                    fontSize: '13px', width: '100%', fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '260px' }}>
              <div style={{ padding: '8px 12px 4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Cộng đồng của bạn
              </div>
              {filteredGroups.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Không tìm thấy cộng đồng nào
                </div>
              )}
              {filteredGroups.map(c => (
                <div
                  key={c.id}
                  onClick={() => { setSelectedGroup(c.id); setShowGroupPicker(false); setGroupSearch(''); }}
                  style={{
                    padding: '10px 12px', cursor: 'pointer', fontSize: '14px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    borderRadius: '8px', margin: '2px 8px',
                    background: c.id === selectedGroup ? 'var(--primary-light)' : 'transparent',
                    transition: 'background 0.12s'
                  }}
                  onMouseEnter={e => { if (c.id !== selectedGroup) e.currentTarget.style.background = 'var(--background)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = c.id === selectedGroup ? 'var(--primary-light)' : 'transparent'; }}
                >
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: c.id === selectedGroup ? 'var(--primary)' : 'var(--border-color)',
                    color: c.id === selectedGroup ? '#fff' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '12px', flexShrink: 0
                  }}>
                    c/
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    {c.tags && c.tags.length > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.tags.slice(0, 3).join(' · ')}
                      </div>
                    )}
                  </div>
                  {c.id === selectedGroup && (
                    <CheckCircle2 size={16} color="var(--primary)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
          fontSize: '13px', fontWeight: 500,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '2px' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Post Card */}
      <div style={{
        background: 'var(--surface)', borderRadius: '12px', overflow: 'hidden',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>


        {/* Content Area */}
        <div style={{ padding: '20px' }}>
          {/* Title Input - always visible */}
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 300))}
            placeholder="Tiêu đề"
            style={{
              width: '100%', padding: '14px 0', marginBottom: '4px',
              border: 'none', outline: 'none', fontSize: '18px', fontWeight: 600,
              background: 'transparent', fontFamily: 'inherit',
              borderBottom: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}
          />
          <div style={{
            display: 'flex', justifyContent: 'flex-end', marginBottom: '12px',
            fontSize: '11px', color: title.length > 270 ? 'var(--error)' : 'var(--text-secondary)', fontWeight: 500
          }}>
            {title.length}/300
          </div>

              <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="Nhập nội dung bài viết..."
                style={{
                  width: '100%', minHeight: '220px', padding: '16px',
                  background: 'var(--background)', border: '1px solid var(--border-color)',
                  borderRadius: '10px', outline: 'none', fontSize: '15px',
                  resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7,
                  color: 'var(--text-primary)', transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
              <div style={{
                display: 'flex', justifyContent: 'flex-end', marginTop: '6px',
                fontSize: '11px', color: charCount > MAX_CHARS * 0.9 ? 'var(--error)' : 'var(--text-secondary)', fontWeight: 500
              }}>
                {charCount}/{MAX_CHARS}
              </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', borderTop: '1px solid var(--border-color)',
          background: 'var(--background)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar src={user?.avatar} fallback={user?.username || 'U'} size="sm" />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Đăng bài <strong style={{ color: 'var(--text-primary)' }}>{user?.displayName || user?.username}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/feed')}
              style={{
                padding: '9px 20px', borderRadius: '24px', fontSize: '14px',
                border: '1px solid var(--border-color)', background: 'var(--surface)',
                color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600,
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--background)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              Hủy
            </button>
            <button
              onClick={handlePost}
              disabled={!canPost}
              style={{
                padding: '9px 24px', borderRadius: '24px', fontSize: '14px',
                border: 'none', background: canPost ? 'var(--primary)' : 'var(--border-color)',
                color: canPost ? '#fff' : 'var(--text-secondary)',
                cursor: canPost ? 'pointer' : 'not-allowed', fontWeight: 600,
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: canPost ? '0 2px 8px rgba(224, 79, 22, 0.3)' : 'none'
              }}
              onMouseEnter={e => { if (canPost) e.currentTarget.style.background = 'var(--primary-hover)'; }}
              onMouseLeave={e => { if (canPost) e.currentTarget.style.background = 'var(--primary)'; }}
            >
              {posting ? <Loader2 size={16} className="spin" /> : 'Đăng bài'}
            </button>
          </div>
        </div>
      </div>

      {/* Rules Sidebar */}
      <div style={{
        marginTop: '20px', padding: '20px', borderRadius: '12px',
        background: 'var(--surface)', border: '1px solid var(--border-color)',
        fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7
      }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px' }}>
          📋 Quy tắc đăng bài
        </div>
        <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>Nội dung phải liên quan đến cộng đồng đã chọn.</li>
          <li>Không đăng nội dung spam hoặc quảng cáo.</li>
          <li>Tôn trọng các thành viên khác trong cộng đồng.</li>
          <li>Không chia sẻ thông tin cá nhân của người khác.</li>
        </ol>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

