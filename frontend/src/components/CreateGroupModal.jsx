import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function CreateGroupModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const token = localStorage.getItem('socily_token');
  const headers = { Authorization: `Bearer ${token}` };

  if (!isOpen) return null;

  const handleClose = () => {
    setFormData({ name: '', description: '' });
    onClose();
  };

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) return;
    
    setCreating(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
      };
      
      const res = await axios.post(`${API}/groups`, payload, { headers });
      handleClose();
      navigate(`/group/${res.data.id}`);
    } catch (error) {
      console.error('Create group error:', error);
      alert('Không thể tạo group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="ccm-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="ccm-modal" style={{ maxWidth: '500px' }}>
        
        {/* Header */}
        <div className="ccm-header">
          <div>
            <h2 className="ccm-title">Create a Private Group</h2>
            <p className="ccm-subtitle">A name and description help people understand what your group is all about.</p>
          </div>
          <button className="ccm-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="ccm-content">
            <div className="ccm-details-section">
              <div className="ccm-details-form" style={{ width: '100%' }}>
                {/* Group Name */}
                <div className="ccm-form-group">
                  <label className="ccm-label">Group name <span className="ccm-required">*</span></label>
                  <div className="ccm-input-wrapper">
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      maxLength={21}
                      placeholder="Nhập tên group..."
                      className="ccm-input"
                    />
                  </div>
                  <div className="ccm-char-count">{formData.name.length}/21</div>
                </div>

                {/* Description */}
                <div className="ccm-form-group">
                  <label className="ccm-label">Description <span className="ccm-required">*</span></label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Mô tả về group của bạn..."
                    rows="3"
                    className="ccm-textarea"
                  />
                  <div className="ccm-char-count">{formData.description.length}</div>
                </div>
              </div>
            </div>
        </div>

        {/* Footer */}
        <div className="ccm-footer" style={{ justifyContent: 'flex-end' }}>
          <div className="ccm-actions">
            <button className="ccm-btn ccm-btn--secondary" onClick={handleClose}>
              Cancel
            </button>

            <button 
              className="ccm-btn ccm-btn--create" 
              onClick={handleCreateGroup} 
              disabled={creating || !formData.name.trim()}
            >
              {creating ? <Loader2 size={18} className="spin" /> : 'Create Group'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
