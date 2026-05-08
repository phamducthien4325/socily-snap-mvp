import React, { useEffect, useState } from 'react';
import { Users, Zap, TrendingUp, MessageCircle, Compass } from 'lucide-react';

export default function Home() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    // In a real app, we would fetch from our FalkorDB backend:
    // fetch('http://localhost:5000/api/groups/discover')
    //   .then(res => res.json())
    //   .then(data => setGroups(data.groups));
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section style={{
        padding: '100px 20px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(127, 126, 255, 0.1) 0%, rgba(248, 249, 255, 0) 100%)'
      }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h1 style={{ fontSize: '60px', marginBottom: '24px', lineHeight: '1.1' }}>
            Find your people, <span className="gradient-text">effortlessly.</span>
          </h1>
          <p style={{ fontSize: '20px', color: 'var(--text-secondary)', marginBottom: '40px' }}>
            Join micro-groups built around what you love.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '18px' }}>
              Join Group
            </button>
            <button className="btn btn-secondary" style={{ padding: '16px 32px', fontSize: '18px' }}>
              Browse Interests
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid Section */}
      <section className="container" style={{ padding: '40px 24px', marginBottom: '80px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '40px', textAlign: 'center' }}>Explore Socily</h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '24px',
          gridAutoRows: 'minmax(250px, auto)'
        }}>
          {/* Discover by Interests - Large */}
          <div className="bento-card" style={{ gridColumn: 'span 8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'rgba(127,126,255,0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                <Compass size={24} />
              </div>
              <h3 style={{ fontSize: '24px', margin: 0 }}>Discover by Interests</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Our graph database instantly connects you to groups based on your overlapping interests.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: 'auto' }}>
              {['Photography', 'AI Engineering', 'Minimalist Design', 'Graph Databases'].map(tag => (
                <span key={tag} style={{ padding: '8px 16px', background: 'var(--background)', borderRadius: '100px', fontSize: '14px', fontWeight: 500 }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Match - Small */}
          <div className="bento-card" style={{ gridColumn: 'span 4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'rgba(127,126,255,0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                <Zap size={24} />
              </div>
              <h3 style={{ fontSize: '24px', margin: 0 }}>Quick Match</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Meet someone new who shares your exact weird combination of hobbies.
            </p>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }}>Find a Match</button>
          </div>

          {/* Active Groups */}
          <div className="bento-card" style={{ gridColumn: 'span 4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'rgba(127,126,255,0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '24px', margin: 0 }}>Active Groups</h3>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Indie Hackers', 'Vinyl Collectors', 'React Devs'].map((c, i) => (
                <li key={c} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <span style={{ fontWeight: 500 }}>{c}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{1200 - i * 300} members</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Trending Topics */}
          <div className="bento-card" style={{ gridColumn: 'span 4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'rgba(127,126,255,0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                <TrendingUp size={24} />
              </div>
              <h3 style={{ fontSize: '24px', margin: 0 }}>Trending Topics</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>#FalkorDB</div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>#GraphDatabases</div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>#ViteReact</div>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="bento-card" style={{ gridColumn: 'span 4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'rgba(127,126,255,0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                <MessageCircle size={24} />
              </div>
              <h3 style={{ fontSize: '24px', margin: 0 }}>Recent Chats</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Jump back into your recent discussions seamlessly.
            </p>
            <div style={{ marginTop: 'auto', padding: '16px', background: 'var(--background)', borderRadius: '12px' }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>AI Engineering</strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>"Has anyone tried the new model?"</span>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works */}
      <section style={{ background: 'var(--surface)', padding: '80px 20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', marginBottom: '60px' }}>How it works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
            <div>
              <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'rgba(127,126,255,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 24px' }}>1</div>
              <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Pick Interests</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Select what you love. Our graph database maps your unique profile.</p>
            </div>
            <div>
              <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'rgba(127,126,255,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 24px' }}>2</div>
              <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Get Matched</h3>
              <p style={{ color: 'var(--text-secondary)' }}>FalkorDB finds overlapping nodes to suggest the perfect groups.</p>
            </div>
            <div>
              <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 24px' }}>3</div>
              <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Start Connecting</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Join the conversation and find your people.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

