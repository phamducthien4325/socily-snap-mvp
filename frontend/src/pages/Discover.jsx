import React, { useState, useEffect } from 'react';
import { Search, Users as UsersIcon, User as UserIcon, Plus, X, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Avatar from '../components/Avatar';
import CreateGroupModal from '../components/CreateGroupModal';

const API = 'http://localhost:5000/api';

export default function Discover() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'groups'
  
  // Data states
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Create Group Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);

  const token = localStorage.getItem('socily_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await axios.get(`${API}/users/quick-match`, { headers });
        if (res.data.matches) setUsers(res.data.matches);
      } else {
        const res = await axios.get(`${API}/groups/discover`, { headers });
        if (res.data.groups) setGroups(res.data.groups);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} recommendations`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset search when switching tabs
    setSearchQuery('');
    setSearchResults(null);
    fetchRecommendations();
  }, [activeTab]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await axios.get(`${API}/users/search?q=${searchQuery}`, { headers });
        if (res.data.users) setSearchResults(res.data.users);
      } else {
        const res = await axios.get(`${API}/groups/search?q=${searchQuery}`, { headers });
        if (res.data.groups) setSearchResults(res.data.groups);
      }
    } catch (error) {
      console.error('Error searching', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (targetId) => {
    try {
      await axios.post(`${API}/users/connect/${targetId}`, {}, { headers });
      setUsers(users.filter(u => u.id !== targetId));
      if (searchResults) {
        setSearchResults(searchResults.map(u => u.id === targetId ? { ...u, isFollowing: true } : u));
      }
    } catch (error) {
      console.error('Error connecting', error);
    }
  };

  const handleJoinGroup = async (commId) => {
    try {
      await axios.post(`${API}/groups/${commId}/join`, {}, { headers });
      // Update UI state
      if (searchResults) {
        setSearchResults(searchResults.map(c => c.id === commId ? { ...c, isMember: true } : c));
      } else {
        // If it's in recommendations, maybe keep it but mark as joined or remove it
        setGroups(groups.filter(c => c.id !== commId));
      }
    } catch (error) {
      console.error('Error joining group', error);
    }
  };

  return (
    <div className="col-main">
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2>Khám phá</h2>
          {activeTab === 'groups' && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
              <Plus size={18} /> Tạo Group
            </button>
          )}
        </div>
        <p className="text-muted" style={{ marginBottom: '24px' }}>Tìm kiếm người dùng và cộng đồng mới.</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
          <button 
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none', background: activeTab === 'users' ? 'var(--primary-light)' : 'transparent', color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('users')}
          >
            <UserIcon size={18} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
            Người dùng
          </button>
          <button 
            className={`btn ${activeTab === 'groups' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none', background: activeTab === 'groups' ? 'var(--primary-light)' : 'transparent', color: activeTab === 'groups' ? 'var(--primary)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('groups')}
          >
            <UsersIcon size={18} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
            Cộng đồng
          </button>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'users' ? "Tìm kiếm theo username..." : "Tìm kiếm group..."}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '12px', fontSize: '15px', color: 'var(--text-color)' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', borderRadius: '8px' }}>
            {loading ? <Loader2 size={18} className="spin" /> : 'Tìm kiếm'}
          </button>
        </form>

        {loading && !searchResults && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={32} className="spin" color="var(--primary)" />
          </div>
        )}

        {/* Users Content */}
        {activeTab === 'users' && !loading && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>{searchResults ? 'Kết quả tìm kiếm' : 'Gợi ý cho bạn'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {(searchResults || users).length === 0 ? <p className="text-muted">Không tìm thấy người dùng nào.</p> : (searchResults || users).map(u => (
                <div key={u.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 24px', border: '1px solid var(--border-color)' }}>
                  <Link to={`/profile/${u.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                      <Avatar src={u.avatar} fallback={u.name || u.username} size="lg" />
                    </div>
                    <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{u.name || u.username}</h3>
                    <p className="text-muted" style={{ fontSize: '13px', marginBottom: '16px' }}>@{u.username}</p>
                  </Link>
                  
                  {!searchResults && (u.sharedFeatures || u.commonCount !== undefined) && (
                    <div style={{ textAlign: 'left', background: 'var(--bg-color)', padding: '12px', borderRadius: '8px', marginBottom: '16px', width: '100%' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Lý do đề xuất:</div>
                      {u.commonCount > 0 && (
                        <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500, marginBottom: '4px' }}>
                          👥 {u.commonCount} bạn bè chung
                        </div>
                      )}
                      {u.sharedFeatures && u.sharedFeatures.length > 0 && (
                        <div style={{ fontSize: '12px', color: 'var(--text-color)' }}>
                          🎯 Điểm chung: {u.sharedFeatures.slice(0, 3).join(', ')}{u.sharedFeatures.length > 3 ? ', ...' : ''}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {u.isFollowing ? (
                    <button className="btn btn-secondary btn-full" disabled style={{ opacity: 0.5 }}>Đã kết nối</button>
                  ) : (
                    <button className="btn btn-primary btn-full" onClick={() => handleConnect(u.id)}>Kết nối</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Groups Content */}
        {activeTab === 'groups' && !loading && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>{searchResults ? 'Kết quả tìm kiếm' : 'Cộng đồng gợi ý'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {(searchResults || groups).length === 0 ? <p className="text-muted">Không tìm thấy cộng đồng nào.</p> : (searchResults || groups).map(c => (
                <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '24px', border: '1px solid var(--border-color)' }}>
                  <Link to={`/group/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UsersIcon size={24} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</h3>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.memberCount} thành viên</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.description || 'Không có mô tả.'}
                    </p>
                  </Link>
                  
                  <div style={{ marginTop: 'auto' }}>
                    {c.isMember ? (
                      <button className="btn btn-secondary btn-full" disabled style={{ opacity: 0.5 }}>Đã tham gia</button>
                    ) : (
                      <button className="btn btn-primary btn-full" onClick={() => handleJoinGroup(c.id)}>Tham gia</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateGroupModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
}

