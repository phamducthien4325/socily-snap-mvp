import React, { useState, useEffect } from 'react';
import { Settings, Sparkles, Loader2, Heart, MessageCircle, UserPlus, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Avatar from '../components/Avatar';

const API = 'http://localhost:5000/api';

export default function Profile() {
  const { user: currentUser } = useAuth();
  const { username } = useParams();
  const profileUsername = username || currentUser?.username;

  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'features'

  const token = localStorage.getItem('socily_token');
  const headers = { Authorization: `Bearer ${token}` };

  const isMyProfile = profileUsername === currentUser?.username;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [profileRes, postsRes, featuresRes] = await Promise.all([
          axios.get(`${API}/users/${profileUsername}`, { headers }),
          axios.get(`${API}/users/${profileUsername}/posts`, { headers }),
          axios.get(`${API}/users/${profileUsername}/features`, { headers })
        ]);
        
        setProfileData(profileRes.data);
        setPosts(postsRes.data.posts || []);
        setFeatures(featuresRes.data.features || []);
      } catch (error) {
        console.error('Error fetching profile data', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (profileUsername) fetchProfile();
  }, [profileUsername]);

  const handleConnect = async () => {
    try {
      await axios.post(`${API}/users/connect/${profileData.id}`, {}, { headers });
      setProfileData(prev => ({ ...prev, isFollowing: true, followersCount: prev.followersCount + 1 }));
    } catch (error) {
      console.error('Error connecting', error);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 size={32} className="spin" color="var(--primary)" /></div>;
  if (!profileData) return <div style={{ padding: '40px', textAlign: 'center' }}>User not found</div>;

  return (
    <div className="col-main">
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        {/* Cover Image */}
        <div style={{ height: '180px', background: 'linear-gradient(135deg, var(--secondary) 0%, #374151 100%)', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: '-40px', left: '32px', background: 'var(--surface)', padding: '6px', borderRadius: '50%' }}>
            <Avatar src={profileData.avatar} fallback={profileData.username} size="lg" className="border-avatar" />
          </div>
          {isMyProfile && (
            <button className="btn btn-secondary" style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px' }}>
              <Settings size={20} />
            </button>
          )}
        </div>
        
        {/* Profile Info */}
        <div style={{ padding: '56px 32px 32px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>{profileData.name || profileData.username}</h1>
              <p className="text-muted" style={{ fontSize: '15px', marginBottom: '16px' }}>@{profileData.username} • {profileData.role || 'User'}</p>
              
              <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                <div><strong style={{ color: 'var(--text-primary)' }}>{profileData.postsCount}</strong> <span className="text-muted">Posts</span></div>
                <div><strong style={{ color: 'var(--text-primary)' }}>{profileData.followersCount}</strong> <span className="text-muted">Followers</span></div>
                <div><strong style={{ color: 'var(--text-primary)' }}>{profileData.followingCount}</strong> <span className="text-muted">Following</span></div>
              </div>
            </div>
            
            {!isMyProfile && (
              <button 
                onClick={handleConnect}
                disabled={profileData.isFollowing}
                className={profileData.isFollowing ? "btn btn-secondary" : "btn btn-primary"}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {profileData.isFollowing ? 'Following' : <><UserPlus size={16} /> Follow</>}
              </button>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)', padding: '0 16px' }}>
          <button 
            onClick={() => setActiveTab('posts')}
            style={{ 
              padding: '16px 24px', background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === 'posts' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'posts' ? 600 : 400,
              borderBottom: activeTab === 'posts' ? '2px solid var(--primary)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <FileText size={18} /> Posts
          </button>
          <button 
            onClick={() => setActiveTab('features')}
            style={{ 
              padding: '16px 24px', background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === 'features' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'features' ? 600 : 400,
              borderBottom: activeTab === 'features' ? '2px solid var(--primary)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Sparkles size={18} /> Features
          </button>
        </div>
      </div>

      {activeTab === 'posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {posts.length === 0 ? (
             <div className="card text-muted" style={{ textAlign: 'center' }}>Chưa có bài viết nào.</div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Avatar src={post.author.avatar} fallback={post.author.username} size="md" />
                  <div>
                    <div style={{ fontWeight: 600 }}>{post.author.name || post.author.username}</div>
                    <div className="text-muted" style={{ fontSize: '13px' }}>
                      @{post.author.username} • {new Date(post.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {post.group && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '12px', background: 'rgba(224, 79, 22, 0.1)', color: 'var(--primary)' }}>
                      📍 {post.group.name}
                    </span>
                  </div>
                )}
                
                <p style={{ marginBottom: '16px', fontSize: '15px' }}>{post.content}</p>
                
                <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: post.isLikedByMe ? '#EF4444' : 'var(--text-secondary)' }}>
                    <Heart size={18} fill={post.isLikedByMe ? '#EF4444' : 'none'} /> {post.likes}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <MessageCircle size={18} /> {post.comments}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'features' && (
        <div className="card">
          {features.length === 0 ? (
            <div className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
              Chưa có feature nào.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {features.map((feature) => (
                <div key={feature.id} style={{
                  padding: '8px 16px',
                  background: 'var(--background)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)'
                }}>
                  {feature.id}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
