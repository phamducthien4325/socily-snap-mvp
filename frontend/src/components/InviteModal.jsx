import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, X, Loader2, Check } from 'lucide-react';
import Avatar from './Avatar';

const API = 'http://localhost:5000/api';

export default function InviteModal({ groupId, onClose }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invited, setInvited] = useState({}); // { [userId]: true }

  const token = localStorage.getItem('socily_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchSuggestions();
  }, [groupId]);

  const fetchSuggestions = async () => {
    try {
      const res = await axios.get(`${API}/groups/${groupId}/invite-suggestions`, { headers });
      setSuggestions(res.data.suggestions);
    } catch (error) {
      console.error('Error fetching suggestions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId) => {
    // In a real app, this would create a notification for the user
    // For now we just mark as invited on UI
    setInvited(prev => ({ ...prev, [userId]: true }));
    // await axios.post(`${API}/groups/${groupId}/invite`, { userId }, { headers });
  };

  return (
    <div className="invite-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="invite-modal" style={{ background: 'var(--bg-secondary)', width: '450px', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <div className="invite-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', margin: 0 }}>
            <UserPlus size={20} color="var(--primary-color)" /> Mời bạn bè
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 className="spin" size={24} />
          </div>
        ) : (
          <div className="suggestions-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {suggestions.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Bạn không có bạn bè nào để gợi ý tham gia.</p>
            ) : (
              suggestions.map(user => (
                <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar src={user.avatar} fallback={user.name} size="sm" />
                    <div>
                      <div style={{ fontWeight: 600 }}>{user.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>@{user.username}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleInvite(user.id)}
                    disabled={invited[user.id]}
                    style={{ 
                      padding: '6px 12px', 
                      borderRadius: '20px', 
                      border: 'none', 
                      background: invited[user.id] ? 'var(--border-color)' : 'var(--primary-color)', 
                      color: invited[user.id] ? 'var(--text-secondary)' : 'white', 
                      cursor: invited[user.id] ? 'default' : 'pointer',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    {invited[user.id] ? (
                      <><Check size={14} /> Đã mời</>
                    ) : (
                      'Mời'
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

