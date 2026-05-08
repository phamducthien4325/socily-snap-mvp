import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, FileText, Loader2, Heart, MessageCircle, Share2,
  Plus, Bell, BellOff, MoreHorizontal, Shield, Lock, Globe,
  Eye, Calendar, ChevronDown, ChevronUp, Pencil, Trash2,
  BookOpen, ArrowUpDown, UserPlus
} from 'lucide-react';
import Avatar from '../components/Avatar';
import InviteModal from '../components/InviteModal';

const API = 'http://localhost:5000/api';

// ============ Group Topic Icons ============
const TOPIC_ICONS = {
  'Gaming': '🎮', 'Sports': '⚽', 'Business': '💼', 'Crypto': '🪙',
  'Television': '📸', 'Celebrity': '⭐', 'Anime': '🎌', 'Tech': '💼',
  'Music': '🎮', 'Art': '🎮', 'Science': '🔬', 'Food': '🍕',
  'Travel': '✈️', 'Fashion': '👗', 'Health': '💼', 'Education': '📚',
  'Movies': '🎮', 'Books': '📕', 'Photography': '📸', 'Nature': '🌿',
};

function getGroupIcon(name, tags) {
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      if (TOPIC_ICONS[tag]) return TOPIC_ICONS[tag];
    }
  }
  // Fallback: generate from name
  const firstChar = (name || 'C').charAt(0).toUpperCase();
  return firstChar;
}

export default function Group() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [sortBy, setSortBy] = useState('best');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [expandedRules, setExpandedRules] = useState({});
  const [showInviteModal, setShowInviteModal] = useState(false);

  const token = localStorage.getItem('socily_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchGroupData();
  }, [id]);

  const fetchGroupData = async () => {
    setLoading(true);
    try {
      const [commRes, postsRes] = await Promise.all([
        axios.get(`${API}/groups/${id}`, { headers }),
        axios.get(`${API}/posts?groupId=${id}`, { headers })
      ]);
      setGroup(commRes.data.group);
      setPosts(postsRes.data.posts);
    } catch (error) {
      console.error('Error fetching group data', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleJoinLeave = async () => {
    setJoining(true);
    try {
      if (group.isMember) {
        await axios.post(`${API}/groups/${id}/leave`, {}, { headers });
        setGroup(prev => ({ ...prev, isMember: false, memberCount: Math.max(0, prev.memberCount - 1) }));
      } else {
        await axios.post(`${API}/groups/${id}/join`, {}, { headers });
        setGroup(prev => ({ ...prev, isMember: true, memberCount: prev.memberCount + 1 }));
      }
    } catch (error) {
      console.error('Join/Leave error', error);
    } finally {
      setJoining(false);
    }
  };

  const toggleRule = (idx) => {
    setExpandedRules(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return (
      <div className="group-page">
        <div className="group-loading">
          <Loader2 size={36} className="spin" color="var(--comm-accent)" />
          <p>Đang tải cộng đồng...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-page">
        <div className="group-not-found">
          <Users size={48} />
          <h3>Không tìm thấy cộng đồng</h3>
          <p>Cộng đồng này có thể đã bị xóa hoặc không tồn tại.</p>
        </div>
      </div>
    );
  }

  const isAdmin = group.myRole === 'admin';
  const isMod = group.myRole === 'moderator' || isAdmin;
  const isPrivate = group.type === 'private' || group.type === 'restricted';
  const groupIcon = getGroupIcon(group.name, group.tags);
  const isEmoji = groupIcon.length > 1 || /\p{Emoji}/u.test(groupIcon);

  // Default group rules
  const defaultRules = [
    { title: 'Tôn trọng lẫn nhau', desc: 'Không được xúc phạm, quấy rối hoặc đe dọa các thành viên khác.' },
    { title: 'Không spam', desc: 'Không đăng nội dung lặp lại hoặc quảng cáo không liên quan.' },
    { title: 'Nội dung phù hợp', desc: 'Đảm bảo bài viết liên quan đến chủ đề cộng đồng.' },
  ];

  const rulesToDisplay = group.rules && group.rules.length > 0 ? group.rules : defaultRules;

  const sortOptions = [
    { value: 'best', label: 'Tốt nhất' },
    { value: 'new', label: 'Mới nhất' },
    { value: 'hot', label: 'Nóng nhất' },
    { value: 'top', label: 'Top' },
  ];

  return (
    <div className="group-page">
      {/* ============ HEADER ============ */}
      <div className="comm-header">
        <div className="comm-header-inner">
          <div className="comm-header-left">
            <div className="comm-avatar-wrapper">
              <div className={`comm-avatar ${isEmoji ? 'comm-avatar--emoji' : ''}`}>
                {isEmoji ? groupIcon : <Users size={32} />}
              </div>
            </div>
            <div className="comm-title-group">
              <h1 className="comm-name">
                r/{group.name}
                {isPrivate && <Lock size={16} className="comm-lock-icon" />}
              </h1>
            </div>
          </div>
          <div className="comm-header-actions">

            {group.isMember && (
              <button className="comm-btn" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} onClick={() => setShowInviteModal(true)}>
                <UserPlus size={16} /> Mời
              </button>
            )}
            <button
              className="comm-btn comm-btn--create"
              onClick={() => navigate('/submit')}
            >
              <Plus size={16} />
              Tạo bài viết
            </button>
            {group.isMember ? (
              <button className="comm-btn comm-btn--joined" onClick={toggleJoinLeave} disabled={joining}>
                {joining ? <Loader2 size={16} className="spin" /> : <BellOff size={16} />}
                {joining ? '' : 'Đã tham gia'}
              </button>
            ) : (
              <button className="comm-btn comm-btn--join" onClick={toggleJoinLeave} disabled={joining}>
                {joining ? <Loader2 size={16} className="spin" /> : 'Tham gia'}
              </button>
            )}

            <button className="comm-btn comm-btn--more">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ============ CONTENT AREA ============ */}
      <div className="comm-content">
        {/* LEFT: Feed */}
        <div className="comm-feed">
          {/* Sort bar */}
          <div className="comm-sort-bar">
            <div className="comm-sort-group">
              <button
                className="comm-sort-btn"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <ArrowUpDown size={14} />
                {sortOptions.find(s => s.value === sortBy)?.label || 'Tốt nhất'}
                <ChevronDown size={14} />
              </button>
              {showSortMenu && (
                <div className="comm-sort-dropdown">
                  {sortOptions.map(opt => (
                    <button
                      key={opt.value}
                      className={`comm-sort-option ${sortBy === opt.value ? 'active' : ''}`}
                      onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="comm-empty-feed">
              <div className="comm-empty-icon">
                <FileText size={48} strokeWidth={1.2} />
              </div>
              <h3>Cộng đồng chưa có bài viết</h3>
              <p>Hãy là người đầu tiên đăng bài!</p>
              <button className="comm-btn comm-btn--create" onClick={() => navigate('/submit')}>
                Tạo bài viết
              </button>
            </div>
          ) : (
            <div className="comm-posts-list">
              {posts.map(post => (
                <div key={post.id} className="comm-post-card">
                  <div className="comm-post-header">
                    <Link to={`/profile/${post.user.handle.replace('@', '')}`} className="comm-post-user-link">
                      <Avatar src={post.user.avatar} fallback={post.user.name || post.user.handle} size="md" />
                    </Link>
                    <div className="comm-post-meta">
                      <Link to={`/profile/${post.user.handle.replace('@', '')}`} className="comm-post-author">
                        {post.user.name}
                      </Link>
                      <span className="comm-post-handle">
                        {post.user.handle} ⬢ {new Date(post.timestamp).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <div className="comm-post-body">
                    <p>{post.content}</p>
                  </div>

                  {post.imageUrl && (
                    <div className="comm-post-image">
                      <img src={post.imageUrl} alt="Post" onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                  )}

                  {post.linkUrl && (
                    <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="comm-post-link">
                      <div className="comm-post-link-icon">🔗</div>
                      <span>{post.linkUrl}</span>
                    </a>
                  )}

                  <div className="comm-post-actions">
                    <button className={`comm-post-action ${post.likedByMe ? 'liked' : ''}`}>
                      <Heart size={16} fill={post.likedByMe ? 'currentColor' : 'none'} />
                      <span>{post.likes}</span>
                    </button>
                    <button className="comm-post-action">
                      <MessageCircle size={16} />
                      <span>{post.comments}</span>
                    </button>
                    <button className="comm-post-action">
                      <Share2 size={16} />
                      <span>Chia sẻ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Sidebar */}
        <div className="comm-sidebar">
          {/* About Card */}
          <div className="comm-sidebar-card comm-about-card">
            <div className="comm-about-header">
              <h3>{group.name}</h3>
            </div>
            {group.description && (
              <p className="comm-about-desc">{group.description}</p>
            )}
            <div className="comm-about-meta">
              <div className="comm-meta-item">
                <Calendar size={14} />
                <span>Tạo ngày {new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="comm-meta-item">
                {isPrivate ? <Lock size={14} /> : <Globe size={14} />}
                <span>{isPrivate ? 'Riêng tư' : 'Công khai'}</span>
              </div>
            </div>

            {/* Insights */}
            <div className="comm-insights">
              <div className="comm-insights-header">
                <span className="comm-insights-title">Thống kê</span>
                <span className="comm-insights-period">Tuần qua ⬺</span>
              </div>
              <div className="comm-insights-grid">
                <div className="comm-insight-item">
                  <strong>{group.memberCount}</strong>
                  <span>Thành viên</span>
                </div>
                <div className="comm-insight-item">
                  <strong>{posts.length}</strong>
                  <span>Bài viết</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rules Card */}
          <div className="comm-sidebar-card comm-rules-card">
            <div className="comm-rules-header">
              <h4>R/{group.name.toUpperCase()} RULES</h4>
            </div>
            <div className="comm-rules-list">
              {rulesToDisplay.map((rule, idx) => (
                <div key={idx} className="comm-rule-item">
                  <button className="comm-rule-toggle" onClick={() => toggleRule(idx)}>
                    <span className="comm-rule-number">{idx + 1}</span>
                    <span className="comm-rule-title">{rule.title}</span>
                    {expandedRules[idx] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expandedRules[idx] && (
                    <div className="comm-rule-desc">{rule.desc}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {group.tags && group.tags.length > 0 && (
            <div className="comm-sidebar-card">
              <h4 style={{ marginBottom: '12px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Chủ đề
              </h4>
              <div className="comm-tags">
                {group.tags.map(tag => (
                  <span key={tag} className="comm-tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {showInviteModal && <InviteModal groupId={id} onClose={() => setShowInviteModal(false)} />}
    </div>
  );
}

