import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Ban, CheckCircle, Search, Shield, Loader2 } from 'lucide-react';
import TopNav from '../components/TopNav';

export default function AdminManagement() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('users');

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'users') {
        const res = await axios.get('http://localhost:5000/api/admin/users');
        setUsers(res.data.users);
      } else {
        const res = await axios.get('http://localhost:5000/api/admin/posts');
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error('Fetch data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (id, isBanned) => {
    if (!window.confirm(`Are you sure you want to ${isBanned ? 'unban' : 'ban'} this user?`)) return;
    try {
      await axios.post(`http://localhost:5000/api/admin/users/${id}/ban`, { ban: !isBanned });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating user status');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting user');
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/posts/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting post');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <TopNav />
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', marginTop: '60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2><Shield size={24} style={{ marginRight: '10px', verticalAlign: 'text-bottom' }} />Admin Management</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={tab === 'users' ? 'btn btn-primary' : 'btn btn-outline'}
              onClick={() => setTab('users')}
            >
              Manage Users
            </button>
            <button 
              className={tab === 'posts' ? 'btn btn-primary' : 'btn btn-outline'}
              onClick={() => setTab('posts')}
            >
              Manage Posts
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Loader2 size={40} className="spinner" />
          </div>
        ) : (
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
                  {tab === 'users' ? (
                    <>
                      <th style={{ padding: '16px' }}>User</th>
                      <th style={{ padding: '16px' }}>Email</th>
                      <th style={{ padding: '16px' }}>Role</th>
                      <th style={{ padding: '16px' }}>Posts</th>
                      <th style={{ padding: '16px' }}>Status</th>
                      <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: '16px' }}>Author</th>
                      <th style={{ padding: '16px' }}>Content</th>
                      <th style={{ padding: '16px' }}>Date</th>
                      <th style={{ padding: '16px' }}>Stats</th>
                      <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {tab === 'users' && users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                      <div className="text-muted" style={{ fontSize: '13px' }}>{user.username}</div>
                    </td>
                    <td style={{ padding: '16px' }}>{user.email}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        background: user.role === 'admin' ? 'var(--primary-light)' : 'var(--surface-hover)',
                        color: user.role === 'admin' ? 'var(--primary)' : 'var(--text-primary)',
                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>{user.postCount}</td>
                    <td style={{ padding: '16px' }}>
                      {user.status === 'banned' ? (
                        <span style={{ color: 'var(--error)', fontWeight: 'bold' }}>Banned</span>
                      ) : (
                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Active</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {user.role !== 'admin' && (
                        <>
                          <button 
                            onClick={() => handleBanUser(user.id, user.status === 'banned')}
                            className="btn btn-outline" 
                            style={{ padding: '6px 12px', fontSize: '13px', marginRight: '8px' }}
                          >
                            {user.status === 'banned' ? <CheckCircle size={16} /> : <Ban size={16} color="var(--error)" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="btn btn-outline" 
                            style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--error)', borderColor: 'var(--error)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                
                {tab === 'posts' && posts.map(post => (
                  <tr key={post.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontWeight: 'bold' }}>{post.author}</td>
                    <td style={{ padding: '16px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {post.content}
                    </td>
                    <td style={{ padding: '16px' }}>{new Date(post.timestamp).toLocaleDateString()}</td>
                    <td style={{ padding: '16px' }}>
                      ❤️ {post.likes} &nbsp; 💬 {post.comments}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="btn btn-outline" 
                        style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--error)', borderColor: 'var(--error)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(tab === 'users' && users.length === 0) || (tab === 'posts' && posts.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                No records found.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
