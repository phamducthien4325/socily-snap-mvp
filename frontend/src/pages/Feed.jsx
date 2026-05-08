import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, ChevronDown, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentsData, setCommentsData] = useState({});

  const token = localStorage.getItem('socily_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchPosts = async (pageNumber = 1) => {
    if (loadingPosts) return;
    setLoadingPosts(true);
    try {
      const res = await axios.get(`${API}/posts?page=${pageNumber}&limit=10`, { headers });
      if (res.data.posts) {
        if (pageNumber === 1) {
          setPosts(res.data.posts);
        } else {
          setPosts(prev => [...prev, ...res.data.posts]);
        }
        setHasMore(res.data.hasMore);
      }
    } catch (error) {
      console.error('Error fetching posts', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 200) {
      if (hasMore && !loadingPosts) {
        setPage(prev => prev + 1);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingPosts]);

  useEffect(() => {
    if (page > 1) {
      fetchPosts(page);
    }
  }, [page]);



  const handleLikeToggle = async (postId, likedByMe) => {
    try {
      if (likedByMe) {
        await axios.post(`${API}/posts/${postId}/unlike`, {}, { headers });
      } else {
        await axios.post(`${API}/posts/${postId}/like`, {}, { headers });
      }
      fetchPosts();
    } catch (error) {
      console.error('Like toggle error', error);
    }
  };

  const handleShare = async (postId) => {
    try {
      await axios.post(`${API}/posts/${postId}/share`, {}, { headers });
      alert('Đã share bài viết!');
    } catch (error) {
      if (error.response?.status === 400) {
        alert('Bạn đã share bài viết này rồi');
      }
    }
  };

  const toggleComments = async (postId) => {
    const newShow = !showComments[postId];
    setShowComments(prev => ({ ...prev, [postId]: newShow }));
    if (newShow && !commentsData[postId]) {
      try {
        const res = await axios.get(`${API}/posts/${postId}/comments`, { headers });
        setCommentsData(prev => ({ ...prev, [postId]: res.data.comments }));
      } catch (error) {
        console.error('Error fetching comments', error);
      }
    }
  };

  const handleComment = async (postId) => {
    const cmtContent = commentInputs[postId];
    if (!cmtContent?.trim()) return;
    try {
      await axios.post(`${API}/posts/${postId}/comment`, { content: cmtContent }, { headers });
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      // Refresh comments
      const res = await axios.get(`${API}/posts/${postId}/comments`, { headers });
      setCommentsData(prev => ({ ...prev, [postId]: res.data.comments }));
      fetchPosts();
    } catch (error) {
      console.error('Comment error', error);
    }
  };

  return (
    <div className="col-main">
      {/* Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {posts.map(post => (
          <div key={post.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link to={`/profile/${post.user.handle.replace('@', '')}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Avatar src={post.user.avatar} fallback={post.user.name || post.user.handle} size="md" />
                </Link>
                <div>
                  <Link to={`/profile/${post.user.handle.replace('@', '')}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontWeight: 600 }}>{post.user.name}</div>
                  </Link>
                  <div className="text-muted" style={{ fontSize: '13px' }}>
                    <Link to={`/profile/${post.user.handle.replace('@', '')}`} style={{ textDecoration: 'none', color: 'inherit' }}>{post.user.handle}</Link> ⬢ {new Date(post.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Group Badge + Tags */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {post.feedScore > 1.0 && (
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444'
                }} title={`Score: ${post.feedScore.toFixed(2)}`}>
                  ⭐ Recommended
                </span>
              )}
              {post.group?.name && (
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '12px',
                  background: 'rgba(224, 79, 22, 0.1)', color: 'var(--primary)'
                }}>
                  🏷️ {post.group.name}
                </span>
              )}
              {post.tags?.filter(t => t).map(tag => (
                <span key={tag} style={{
                  fontSize: '11px', padding: '2px 8px', borderRadius: '8px',
                  background: 'var(--background)', color: 'var(--text-secondary)', fontWeight: 500
                }}>
                  #{tag}
                </span>
              ))}
            </div>

            {/* Content */}
            <p style={{ marginBottom: '12px', fontSize: '15px', lineHeight: 1.6 }}>{post.content}</p>

            {/* Post Image */}
            {post.imageUrl && (
              <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img src={post.imageUrl} alt="Post" style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; }} />
              </div>
            )}

            {/* Post Link */}
            {post.linkUrl && (
              <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                background: 'var(--background)', border: '1px solid var(--border-color)',
                borderRadius: '10px', textDecoration: 'none', color: 'inherit',
                marginBottom: '16px', transition: 'border-color 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'var(--primary-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>🔗</div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {post.linkUrl}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {(() => { try { return new URL(post.linkUrl).hostname; } catch { return 'Link'; } })()}
                  </div>
                </div>
              </a>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <button
                onClick={() => handleLikeToggle(post.id, post.likedByMe)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none',
                  color: post.likedByMe ? '#EF4444' : 'var(--text-secondary)', cursor: 'pointer',
                  fontWeight: post.likedByMe ? 600 : 400, transition: 'all 0.2s'
                }}
              >
                <Heart size={18} fill={post.likedByMe ? '#EF4444' : 'none'} /> {post.likes}
              </button>
              <button
                onClick={() => toggleComments(post.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <MessageCircle size={18} /> {post.comments}
              </button>
              <button
                onClick={() => handleShare(post.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <Share2 size={18} /> Share
              </button>
            </div>

            {/* Comments Section */}
            {showComments[post.id] && (
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                {/* Comment input */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                    placeholder="Viết bình luận..."
                    style={{
                      flex: 1, padding: '8px 14px', borderRadius: '20px', fontSize: '13px',
                      border: '1px solid var(--border-color)', background: 'var(--background)', outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => handleComment(post.id)}
                    style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Send size={14} color="#fff" />
                  </button>
                </div>
                {/* Comments list */}
                {commentsData[post.id]?.map(cmt => (
                  <div key={cmt.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', padding: '8px 0' }}>
                    <Avatar src={cmt.user.avatar} fallback={cmt.user.username} size="sm" />
                    <div style={{ background: 'var(--background)', borderRadius: '12px', padding: '8px 14px', flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>@{cmt.user.username}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{cmt.content}</div>
                    </div>
                  </div>
                ))}
                {commentsData[post.id]?.length === 0 && (
                  <div className="text-muted" style={{ fontSize: '13px', textAlign: 'center', padding: '8px 0' }}>Chưa có bình luận nào</div>
                )}
              </div>
            )}
          </div>
        ))}
        {loadingPosts && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
            <Loader2 size={24} className="spin" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '8px', fontSize: '13px' }}>Đang tải thêm bài viết...</p>
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Không còn bài viết nào khác.
          </div>
        )}
      </div>
    </div>
  );
}

