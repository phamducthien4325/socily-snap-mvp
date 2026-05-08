import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, Menu, Plus, User, Users, FileText, Loader2, X, ArrowRight, Clock, TrendingUp, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import CreateGroupModal from './CreateGroupModal';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API = 'http://localhost:5000/api';

export default function TopNav({ toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const token = localStorage.getItem('socily_token');
  const headers = { Authorization: `Bearer ${token}` };

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], groups: [], posts: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'users' | 'groups' | 'posts'
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchRecentAndTrending = useCallback(async () => {
    try {
      const [recentRes, trendingRes] = await Promise.all([
        axios.get(`${API}/search/recent`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/search/trending`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRecentSearches(recentRes.data.recentSearches || []);
      setTrendingSearches(trendingRes.data.trendingSearches || []);
    } catch (error) {
      console.error('Error fetching recent/trending:', error);
    }
  }, [token]);

  useEffect(() => {
    if (showDropdown && !searchQuery.trim()) {
      fetchRecentAndTrending();
    }
  }, [showDropdown, searchQuery, fetchRecentAndTrending]);

  const navItems = [
    { name: 'Home Feed', path: '/feed' },
    { name: 'Suggestions', path: '/discover' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'Profile', path: '/profile' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Debounced search
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults({ users: [], groups: [], posts: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const [usersRes, groupsRes, postsRes] = await Promise.all([
        axios.get(`${API}/users/search?q=${encodeURIComponent(query)}`, { headers }),
        axios.get(`${API}/groups/search?q=${encodeURIComponent(query)}`, { headers }),
        axios.get(`${API}/posts/search?q=${encodeURIComponent(query)}`, { headers })
      ]);

      setSearchResults({
        users: usersRes.data.users || [],
        groups: groupsRes.data.groups || [],
        posts: postsRes.data.posts || []
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);

    // Debounce 300ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ users: [], groups: [], posts: [] });
    // Don't close dropdown, just clear query so it shows recent/trending
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      try {
        await axios.post(`${API}/search/recent`, { text: searchQuery.trim() }, { headers });
        fetchRecentAndTrending();
      } catch (error) {
        console.error('Save search error:', error);
      }
    }
  };

  const handleSuggestionClick = (text) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    performSearch(text);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle join group
  const handleJoinGroup = async (groupId) => {
    try {
      await axios.post(`${API}/groups/${groupId}/join`, {}, { headers });
      // Update result state
      setSearchResults(prev => ({
        ...prev,
        groups: prev.groups.map(c =>
          c.id === groupId ? { ...c, isMember: true } : c
        )
      }));
    } catch (error) {
      if (error.response?.status === 400) {
        alert('Bạn đã là thành viên rồi');
      }
    }
  };

  // Handle connect user
  const handleConnectUser = async (userId) => {
    try {
      await axios.post(`${API}/users/connect/${userId}`, {}, { headers });
      setSearchResults(prev => ({
        ...prev,
        users: prev.users.map(u =>
          u.id === userId ? { ...u, isFollowing: true } : u
        )
      }));
    } catch (error) {
      console.error('Connect error:', error);
    }
  };

  // Filter results based on active tab
  const filteredUsers = (activeTab === 'all' || activeTab === 'users') ? searchResults.users : [];
  const filteredGroups = (activeTab === 'all' || activeTab === 'groups') ? searchResults.groups : [];
  const filteredPosts = (activeTab === 'all' || activeTab === 'posts') ? searchResults.posts : [];
  const totalResults = searchResults.users.length + searchResults.groups.length + searchResults.posts.length;
  const hasResults = totalResults > 0;
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <header className="top-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={toggleSidebar}
            className="btn" 
            style={{ padding: '8px', borderRadius: '50%', background: 'transparent' }}
          >
            <Menu size={24} color="var(--text-primary)" />
          </button>
          <Link to="/feed" style={{ textDecoration: 'none', color: 'var(--primary)' }}>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '24px' }}>Socily</h2>
          </Link>
        </div>
        
        <nav className="nav-links">
          {navItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Enhanced Search Bar */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <div className={`search-bar ${showDropdown ? 'search-bar--active' : ''}`}
            style={{
              width: showDropdown ? '400px' : '300px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 100
            }}
          >
            <Search size={18} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Tìm kiếm người dùng, group..." 
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
            />
            {isSearching && <Loader2 size={16} className="spin" style={{ color: 'var(--primary)', flexShrink: 0 }} />}
            {hasQuery && !isSearching && (
              <button
                onClick={clearSearch}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', flexShrink: 0 }}
              >
                <X size={16} color="var(--text-secondary)" />
              </button>
            )}
          </div>
          {/* Search Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div 
                className="search-dropdown"
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {!hasQuery ? (
                  <div className="search-suggestions" style={{ padding: '12px 0' }}>
                    {recentSearches.length > 0 && (
                      <div className="search-section">
                        <div className="search-section-header" style={{ padding: '0 16px', marginBottom: '8px' }}>
                          <span>Recent</span>
                        </div>
                        {recentSearches.map((item, idx) => (
                          <div 
                            key={`recent-${idx}`} 
                            className="search-result-item" 
                            style={{ padding: '10px 16px', cursor: 'pointer' }}
                            onClick={() => handleSuggestionClick(item.text)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <Clock size={16} color="var(--text-secondary)" />
                              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{item.text}</span>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                axios.delete(`${API}/search/recent/${encodeURIComponent(item.text)}`, { headers })
                                  .then(() => fetchRecentAndTrending())
                                  .catch(err => console.error(err));
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                            >
                              <X size={14} color="var(--text-secondary)" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {trendingSearches.length > 0 && (
                      <div className="search-section" style={{ marginTop: recentSearches.length > 0 ? '16px' : '0' }}>
                        <div className="search-section-header" style={{ padding: '0 16px', marginBottom: '8px' }}>
                          <span>Trending</span>
                        </div>
                        {trendingSearches.map((item, idx) => (
                          <div 
                            key={`trending-${idx}`} 
                            className="search-result-item" 
                            style={{ padding: '10px 16px', cursor: 'pointer' }}
                            onClick={() => handleSuggestionClick(item.text)}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                              <TrendingUp size={18} color="var(--primary)" style={{ marginTop: '2px' }} />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.text}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dựa trên sở thích của bạn</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {recentSearches.length === 0 && trendingSearches.length === 0 && (
                      <div className="search-empty">
                        <Search size={24} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                        <span>Nhập từ khóa để tìm kiếm...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Tab Filter */}
                    <div className="search-tabs">
                      {[
                        { key: 'all', label: 'Tất cả', count: totalResults },
                        { key: 'users', label: 'Người dùng', count: searchResults.users.length, icon: <User size={13} /> },
                        { key: 'groups', label: 'Group', count: searchResults.groups.length, icon: <Users size={13} /> },
                        { key: 'posts', label: 'Bài viết', count: searchResults.posts.length, icon: <FileText size={13} /> }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`search-tab ${activeTab === tab.key ? 'search-tab--active' : ''}`}
                        >
                          {tab.icon && tab.icon}
                          {tab.label}
                          {tab.count > 0 && (
                            <span className="search-tab-count">{tab.count}</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Results */}
                    <div className="search-results">
                      {isSearching ? (
                        <div className="search-empty">
                          <Loader2 size={24} className="spin" style={{ color: 'var(--primary)' }} />
                          <span>Đang tìm kiếm...</span>
                        </div>
                      ) : !hasResults ? (
                        <div className="search-empty">
                          <Search size={24} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                          <span>Không tìm thấy kết quả cho "{searchQuery}"</span>
                        </div>
                      ) : (
                        <>
                          {/* Users Section */}
                          {filteredUsers.length > 0 && (
                            <div className="search-section">
                              <div className="search-section-header">
                                <User size={14} />
                                <span>Người dùng</span>
                                <span className="search-section-count">{filteredUsers.length}</span>
                              </div>
                              {filteredUsers.map(u => (
                                <div
                                  key={u.id}
                                  className="search-result-item"
                                >
                                  <Link
                                    to={`/profile/${u.username}`}
                                    onClick={() => { setShowDropdown(false); clearSearch(); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, textDecoration: 'none', color: 'inherit', minWidth: 0 }}
                                  >
                                    <Avatar src={u.avatar} fallback={u.name || u.username} size="sm" />
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {u.name || u.username}
                                      </div>
                                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>@{u.username}</div>
                                    </div>
                                  </Link>
                                  {u.isFollowing ? (
                                    <span className="search-badge search-badge--following">Đang theo dõi</span>
                                  ) : (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleConnectUser(u.id); }}
                                      className="search-action-btn"
                                    >
                                      Follow
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Groups Section */}
                          {filteredGroups.length > 0 && (
                            <div className="search-section">
                              <div className="search-section-header">
                                <Users size={14} />
                                <span>Group</span>
                                <span className="search-section-count">{filteredGroups.length}</span>
                              </div>
                              {filteredGroups.map(c => (
                                <div
                                  key={c.id}
                                  className="search-result-item"
                                >
                                  <Link to={`/group/${c.id}`} onClick={() => { setShowDropdown(false); clearSearch(); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
                                    <div className="search-group-icon">
                                      <Users size={16} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {c.name}
                                      </div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>{c.memberCount} thành viên</span>
                                        {c.description && (
                                          <>
                                            <span>⬢</span>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </Link>
                                  {c.isMember ? (
                                    <span className="search-badge search-badge--member">Thành viên</span>
                                  ) : (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleJoinGroup(c.id); }}
                                      className="search-action-btn"
                                    >
                                      Tham gia
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Posts Section */}
                          {filteredPosts.length > 0 && (
                            <div className="search-section">
                              <div className="search-section-header">
                                <FileText size={14} />
                                <span>Bài viết</span>
                                <span className="search-section-count">{filteredPosts.length}</span>
                              </div>
                              {filteredPosts.map(p => (
                                <div key={p.id} className="search-result-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }} onClick={() => { setShowDropdown(false); clearSearch(); navigate(`/post/${p.id}`); }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    <Avatar src={p.user.avatar} fallback={p.user.name} size="xs" />
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.user.name}</span>
                                    {p.group && (
                                      <>
                                        <span>trong</span>
                                        <Link to={`/group/${p.group.id}`} onClick={(e) => { e.stopPropagation(); setShowDropdown(false); clearSearch(); }} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                                          {p.group.name}
                                        </Link>
                                      </>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '13px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {p.content}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/submit" style={{ textDecoration: 'none' }}>
            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>
              <Plus size={18} />
              Tạo bài
            </button>
          </Link>
          <button 
            className="btn btn-outline" 
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}
          >
            <Users size={18} />
            Tạo Group
          </button>

          {/* User Info + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Avatar src={user?.avatar} fallback={user?.username} size="sm" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>{user?.username || 'User'}</span>
            <button 
              onClick={handleLogout} 
              className="btn" 
              style={{ padding: '8px', borderRadius: '50%', background: 'var(--background)' }}
              title="Đăng xuất"
            >
              <LogOut size={18} color="var(--error)" />
            </button>
          </div>
        </div>
      </div>
      
      <CreateGroupModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </header>
  );
}

