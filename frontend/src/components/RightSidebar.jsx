import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, Users, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function RightSidebar() {
  const trendingNodes = [
    { name: '#GraphDatabases', posts: '1.2k' },
    { name: '#ReactJS', posts: '856' },
    { name: '#SystemArchitecture', posts: '432' },
    { name: '#UIUX', posts: '320' },
  ];

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  const fetchSuggestions = async (pageNum) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('socily_token');
      const res = await axios.get(`http://localhost:5000/api/users/quick-match?page=${pageNum}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuggestedUsers(prev => {
        // avoid duplicates
        const newMatches = res.data.matches.filter(m => !prev.find(p => p.id === m.id));
        return [...prev, ...newMatches];
      });
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions(page);
  }, [page]);

  const lastUserElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const handleConnect = async (userId) => {
    try {
      const token = localStorage.getItem('socily_token');
      await axios.post(`http://localhost:5000/api/users/connect/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove from suggestions after connecting
      setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error(err);
      alert('Error connecting');
    }
  };

  const getScoreColor = (score) => {
    if (score > 3) return '#10B981';
    if (score > 1) return '#F59E0B';
    return '#6B7280';
  };

  return (
    <aside className="col-right">
      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '16px' }}>
          <TrendingUp size={18} color="var(--primary)" />
          Trending Nodes
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {trendingNodes.map(node => (
            <div key={node.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{node.name}</div>
                <div className="text-muted" style={{ fontSize: '12px' }}>{node.posts} posts</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '450px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '16px', flexShrink: 0 }}>
          <Users size={18} color="var(--secondary)" />
          Suggested Connections
        </h3>

        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', paddingRight: '4px' }}>
          {suggestedUsers.map((user, index) => {
            const isLast = index === suggestedUsers.length - 1;
            return (
              <div 
                ref={isLast ? lastUserElementRef : null} 
                key={user.id} 
                style={{ padding: '8px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div className="avatar avatar-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', background: 'var(--border-color)', textTransform: 'uppercase', flexShrink: 0 }}>
                      {user.username?.substring(0, 2)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
                      <div style={{ fontSize: '11px', color: getScoreColor(user.matchScore), fontWeight: 600 }}>
                        ⚡ Score: {user.matchScore}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleConnect(user.id)} className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '11px', flexShrink: 0, whiteSpace: 'nowrap' }}>Connect</button>
                </div>

                {/* Shared Interests Tags */}
                {user.sharedInterests && user.sharedInterests.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {user.sharedInterests.slice(0, 4).map(interest => (
                      <span key={interest} style={{
                        fontSize: '10px', padding: '1px 7px', borderRadius: '6px',
                        background: 'rgba(224, 79, 22, 0.1)', color: 'var(--primary)', fontWeight: 500
                      }}>
                        {interest}
                      </span>
                    ))}
                    {user.sharedInterests.length > 4 && (
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>+{user.sharedInterests.length - 4}</span>
                    )}
                  </div>
                )}

                {/* Score breakdown (small) */}
                {(user.commonCount > 0 || user.adamicAdar > 0) && (
                  <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', gap: '10px' }}>
                    {user.commonCount > 0 && <span>👥 {user.commonCount} bạn chung</span>}
                    {user.adamicAdar > 0 && <span>📐 AA: {user.adamicAdar}</span>}
                  </div>
                )}
              </div>
            );
          })}
          {loading && <div style={{ textAlign: 'center', padding: '10px' }}><Loader2 size={20} className="spin" style={{ margin: '0 auto' }} /></div>}
          {!hasMore && suggestedUsers.length > 0 && <div className="text-muted" style={{ textAlign: 'center', fontSize: '12px', padding: '10px 0' }}>Hết danh sách gợi ý</div>}
          {!loading && suggestedUsers.length === 0 && <div className="text-muted" style={{ textAlign: 'center', fontSize: '12px', padding: '10px 0' }}>Không có gợi ý nào</div>}
        </div>
      </div>
    </aside>
  );
}
