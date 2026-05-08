import React, { useState, useEffect } from 'react';
import { Home, Users, User, PenTool, Shield, ChevronDown, ChevronRight, Hash, Compass, Star, Plus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import CreateGroupModal from './CreateGroupModal';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function LeftSidebar({ isOpen }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [myGroups, setMyGroups] = useState([]);
  const [isGroupsOpen, setIsGroupsOpen] = useState(true);

  // Create Group Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchMyGroups = async () => {
        try {
          const res = await axios.get('http://localhost:5000/api/groups/my-groups', {
            headers: { Authorization: `Bearer ${localStorage.getItem('socily_token')}` }
          });
          setMyGroups(res.data.groups);
        } catch (error) {
          console.error("Error fetching my groups", error);
        }
      };
      fetchMyGroups();
    }
  }, [user]);

  const menuItems = [
    { icon: <Home size={20} />, label: 'Home Feed', path: '/feed' },
    { icon: <Users size={20} />, label: 'Suggestions', path: '/discover' },
    { icon: <User size={20} />, label: 'Profile', path: '/profile' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ icon: <PenTool size={20} />, label: 'Graph Admin', path: '/graph-admin' });
    menuItems.push({ icon: <Shield size={20} />, label: 'Management', path: '/admin-management' });
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.aside 
            className="col-left" 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: 'hidden', flexShrink: 0, borderRight: '1px solid var(--border-color)' }}
          >
            <div style={{ padding: '24px 16px', height: '100%', display: 'flex', flexDirection: 'column', width: 280, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '0 8px' }}>
            <Avatar src={user?.avatar} fallback={user?.username} size="lg" />
            <div>
              <h4 style={{ margin: 0, fontSize: '15px' }}>{user?.username || 'User'}</h4>
              <span className="text-muted" style={{ fontSize: '13px' }}>@{user?.username || 'user'}</span>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {menuItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '12px 16px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.icon}
                      {item.label}
                    </div>
                    {item.badge > 0 && (
                      <span style={{
                        background: 'var(--primary)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
            </nav>

            {/* Groups Section */}
            <div style={{ marginTop: '24px', padding: '0 8px' }}>
              <div 
                onClick={() => setIsGroupsOpen(!isGroupsOpen)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px 8px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                <span>Groups</span>
                {isGroupsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
              
              <AnimatePresence>
                {isGroupsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}
                  >
                    <Link 
                      to="/discover"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '10px 8px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <Compass size={18} />
                      Explore Groups
                    </Link>

                    <div 
                      onClick={() => setShowCreateModal(true)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '10px 8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: 'var(--primary)',
                        fontSize: '14px',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <Plus size={18} />
                      Tạo Group
                    </div>

                    {myGroups.map(comm => (
                      <Link 
                        key={comm.id} 
                        to={`/group/${comm.id}`}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '10px 8px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: location.pathname === `/group/${comm.id}` ? 'var(--primary)' : 'var(--text-primary)',
                          background: location.pathname === `/group/${comm.id}` ? 'var(--primary-light)' : 'transparent',
                          fontSize: '14px',
                          transition: 'var(--transition-smooth)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                          <Hash size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {comm.name}
                          </span>
                        </div>
                        <Star size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </motion.aside>
        )}
      </AnimatePresence>

      {/* Create Group Modal - sử dụng component mới 3 bước */}
      <CreateGroupModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </>
  );
}

