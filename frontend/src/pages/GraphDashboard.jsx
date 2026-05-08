import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';
import { BarChart3, Network, Terminal, Zap, Play, Loader2, AlertCircle, CheckCircle2, Database, Users, Hash, ArrowRightLeft, ArrowLeft, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api/graph';

// ============================================
// Module 1: Graph Statistics
// ============================================
function GraphStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('socily_token');
    axios.get(`${API}/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card" style={{ textAlign: 'center', padding: '40px' }}><Loader2 size={24} className="spin" /> Đang tải...</div>;
  if (!stats) return <div className="card">Không thể tải dữ liệu</div>;

  const nodeItems = [
    { label: 'Users', count: stats.nodes.users, icon: <Users size={16} />, color: '#3B82F6' },
    { label: 'Posts', count: stats.nodes.posts, icon: <FileText size={16} />, color: '#10B981' },
    { label: 'Interests', count: stats.nodes.interests, icon: <Hash size={16} />, color: '#E04F16' },
    { label: 'Groups', count: stats.nodes.groups, icon: <Database size={16} />, color: '#8B5CF6' }
  ];

  const edgeItems = [
    { label: 'HAS_INTEREST', count: stats.edges.has_interest },
    { label: 'BELONGS_TO', count: stats.edges.belongs_to },
    { label: 'RELATED_TO', count: stats.edges.related_to },
    { label: 'FOLLOWS', count: stats.edges.follows },
    { label: 'POSTED', count: stats.edges.posted },
    { label: 'POSTED_IN', count: stats.edges.posted_in },
    { label: 'LIKED', count: stats.edges.liked }
  ];

  return (
    <div className="card">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '16px' }}>
        <BarChart3 size={20} color="var(--primary)" /> Graph Statistics
        <span style={{ marginLeft: 'auto', fontSize: '11px', background: '#10B981', color: '#fff', padding: '2px 10px', borderRadius: '9999px', fontWeight: 600 }}>LIVE</span>
      </h3>

      {/* Big Numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ textAlign: 'center', padding: '20px', borderRadius: '16px', background: 'var(--background)' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>{stats.totalNodes}</div>
          <div className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Nodes</div>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', borderRadius: '16px', background: 'var(--background)' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#8B5CF6' }}>{stats.totalEdges}</div>
          <div className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Edges</div>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', borderRadius: '16px', background: 'var(--background)' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#10B981' }}>{stats.density}</div>
          <div className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Density</div>
        </div>
      </div>

      {/* Node breakdown */}
      <div style={{ marginBottom: '20px' }}>
        <div className="text-muted" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Node Distribution</div>
        {nodeItems.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ color: item.color }}>{item.icon}</div>
            <span style={{ fontSize: '14px', fontWeight: 500, flex: 1 }}>{item.label}</span>
            <span style={{ fontWeight: 700 }}>{item.count}</span>
            <div style={{ width: '80px', height: '6px', borderRadius: '3px', background: 'var(--border-color)', overflow: 'hidden' }}>
              <div style={{ width: `${stats.totalNodes ? (item.count / stats.totalNodes * 100) : 0}%`, height: '100%', borderRadius: '3px', background: item.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Edge breakdown */}
      <div>
        <div className="text-muted" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Edge Types</div>
        {edgeItems.map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{item.label}</span>
            <span style={{ fontWeight: 700 }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Module 2: Graph Visualization
// ============================================
function GraphVisualization() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const fgRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem('socily_token');
    axios.get(`${API}/visualization`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const { nodes, links } = res.data;
        const validNodeIds = new Set(nodes.map(n => n.id));
        const validLinks = links.filter(l => validNodeIds.has(l.source) && validNodeIds.has(l.target));
        setGraphData({ nodes, links: validLinks });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const nodeColor = useCallback((node) => {
    switch(node.type) {
      case 'User': return '#3B82F6';
      case 'Interest': return '#E04F16';
      case 'Group': return '#8B5CF6';
      default: return '#6B7280';
    }
  }, []);

  const nodeLabel = useCallback((node) => `${node.type}: ${node.name}`, []);

  if (loading) return <div className="card" style={{ textAlign: 'center', padding: '60px' }}><Loader2 size={24} className="spin" /> Đang tải đồ thị...</div>;

  return (
    <div className="card" style={{ padding: '16px', overflow: 'hidden' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '16px', padding: '0 8px' }}>
        <Network size={20} color="var(--primary)" /> Graph Visualization
      </h3>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', padding: '0 8px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }} /> User
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E04F16', display: 'inline-block' }} /> Interest
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8B5CF6', display: 'inline-block' }} /> Group
        </span>
      </div>
      <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#0F172A', height: '400px' }}>
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeColor={nodeColor}
            nodeLabel={nodeLabel}
            nodeRelSize={6}
            linkColor={() => 'rgba(255,255,255,0.15)'}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            backgroundColor="#0F172A"
            width={600}
            height={400}
          />
        ) : (
          <div style={{ color: '#fff', textAlign: 'center', paddingTop: '180px', opacity: 0.5 }}>Chưa có dữ liệu. Hãy chạy Benchmark trước.</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Module 3: Cypher Query Playground
// ============================================
function CypherPlayground() {
  const presets = [
    { name: 'Tất cả Users', query: `MATCH (u:User) RETURN u.id AS id, u.username AS name LIMIT 20` },
    { name: 'Bạn của bạn (2-hop)', query: `MATCH (u:User {id: 'bench_1'})-[:FOLLOWS]->()-[:FOLLOWS]->(fof) WHERE fof <> u RETURN DISTINCT fof.username AS name LIMIT 10` },
    { name: 'Bạn chung (Mutual)', query: `MATCH (a:User {id: 'bench_1'})-[:FOLLOWS]->(mutual)<-[:FOLLOWS]-(b:User {id: 'bench_25'}) RETURN mutual.username AS name` },
    { name: 'Influencer (Most Followers)', query: `MATCH (u:User)<-[:FOLLOWS]-(f) RETURN u.username AS user, count(f) AS followers ORDER BY followers DESC LIMIT 10` },
    { name: 'Sở thích phổ biến', query: `MATCH (u:User)-[:HAS_INTEREST]->(i:Interest) RETURN i.name AS interest, count(u) AS users ORDER BY users DESC LIMIT 10` },
    { name: 'Cộng đồng theo Interest', query: `MATCH (c:Group)-[:RELATED_TO]->(i:Interest)<-[:HAS_INTEREST]-(u:User) RETURN c.name AS group, count(DISTINCT u) AS relevantUsers ORDER BY relevantUsers DESC LIMIT 10` },
    { name: 'Ultimate Feed', query: `MATCH (me:User {id: 'bench_1'})-[:FOLLOWS]->(friend:User)-[:BELONGS_TO]->(c:Group)<-[:POSTED_IN]-(p:Post) MATCH (c)-[:RELATED_TO]->(i:Interest)<-[:HAS_INTEREST]-(me) RETURN p.id AS Post, c.name AS Group, i.name AS Interest, count(friend) AS FriendsInComm ORDER BY FriendsInComm DESC LIMIT 10` },
    { name: 'Gợi ý Cộng đồng', query: `MATCH (me:User {id: 'bench_1'})-[:HAS_INTEREST]->(i:Interest)<-[:HAS_INTEREST]-(similar:User)-[:BELONGS_TO]->(c:Group) WHERE NOT (me)-[:BELONGS_TO]->(c) RETURN c.name AS RecommendedGroup, count(similar) AS SimilarityScore ORDER BY SimilarityScore DESC LIMIT 10` }
  ];

  const [query, setQuery] = useState(presets[0].query);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const runQuery = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('socily_token');
      const res = await axios.post(`${API}/query`, { cypher: query }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '16px' }}>
        <Terminal size={20} color="var(--primary)" /> Cypher Query Playground
      </h3>

      {/* Preset buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {presets.map(p => (
          <button key={p.name} onClick={() => setQuery(p.query)}
            className="btn btn-outline"
            style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '8px' }}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Query input */}
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%', minHeight: '80px', padding: '12px',
          fontFamily: 'monospace', fontSize: '13px',
          borderRadius: '12px', border: '1px solid var(--border-color)',
          background: '#0F172A', color: '#E2E8F0',
          resize: 'vertical', outline: 'none', marginBottom: '12px'
        }}
      />

      <button onClick={runQuery} disabled={loading} className="btn btn-primary" style={{ marginBottom: '16px' }}>
        {loading ? <><Loader2 size={16} className="spin" /> Đang chạy...</> : <><Play size={16} /> Chạy Query</>}
      </button>

      {/* Error */}
      {error && (
        <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px', borderRadius: '12px', fontSize: '13px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '13px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontWeight: 600 }}>
              <CheckCircle2 size={14} /> {result.rowCount} rows
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600 }}>
              <Zap size={14} /> {result.executionTimeMs} ms
            </span>
          </div>
          <div style={{ borderRadius: '12px', overflow: 'auto', maxHeight: '250px', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--background)' }}>
                  {result.data.length > 0 && (
                    typeof result.data[0] === 'object' && !Array.isArray(result.data[0])
                      ? Object.keys(result.data[0]).map((key, i) => (
                          <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>{key}</th>
                        ))
                      : Array.isArray(result.data[0])
                        ? result.data[0].map((_, i) => (
                            <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Col {i + 1}</th>
                          ))
                        : <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Result</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {result.data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {typeof row === 'object' && !Array.isArray(row)
                      ? Object.values(row).map((val, j) => (
                          <td key={j} style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{JSON.stringify(val)}</td>
                        ))
                      : Array.isArray(row)
                        ? row.map((val, j) => (
                            <td key={j} style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{JSON.stringify(val)}</td>
                          ))
                        : <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{JSON.stringify(row)}</td>
                    }
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Module 4: Performance Benchmark
// ============================================
function PerformanceBenchmark() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runBenchmark = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const token = localStorage.getItem('socily_token');
      const res = await axios.post(`${API}/benchmark`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Benchmark failed');
    } finally {
      setLoading(false);
    }
  };

  const getBarWidth = (timeMs) => {
    if (!results) return '0%';
    const maxTime = Math.max(...results.benchmarks.map(b => parseFloat(b.timeMs)));
    return `${Math.max(5, (parseFloat(timeMs) / maxTime) * 100)}%`;
  };

  return (
    <div className="card">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '16px' }}>
        <Zap size={20} color="var(--primary)" /> Performance Benchmark
      </h3>

      <p className="text-muted" style={{ marginBottom: '20px', fontSize: '13px' }}>
        Tạo 50 users + quan hệ ngẫu nhiên, sau đó đo thời gian truy vấn Graph Traversal. So sánh với SQL tương đương.
      </p>

      <button onClick={runBenchmark} disabled={loading} className="btn btn-primary" style={{ marginBottom: '20px' }}>
        {loading ? <><Loader2 size={16} className="spin" /> Đang chạy benchmark...</> : <><Play size={16} /> Run Benchmark</>}
      </button>

      {error && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px', borderRadius: '12px', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

      {results && (
        <>
          {/* Seed info */}
          <div style={{ background: 'var(--background)', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '13px' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>🏷️ Seed Data</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', color: 'var(--text-secondary)' }}>
              <span>Users: {results.seedInfo.usersCreated}</span>
              <span>Follow relations: {results.seedInfo.followRelations}</span>
              <span>Interest links: {results.seedInfo.interestsLinked}</span>
              <span>Seed time: {results.seedInfo.seedTimeMs}ms</span>
            </div>
          </div>

          {/* Benchmark results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {results.benchmarks.map((b, i) => (
              <div key={i} style={{ borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>{b.name}</span>
                  <span style={{
                    fontSize: '18px', fontWeight: 800,
                    color: parseFloat(b.timeMs) < 5 ? '#10B981' : parseFloat(b.timeMs) < 20 ? '#F59E0B' : '#EF4444'
                  }}>
                    {b.timeMs}ms
                  </span>
                </div>
                <p className="text-muted" style={{ fontSize: '12px', marginBottom: '8px' }}>{b.description}</p>
                {/* Bar */}
                <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{
                    width: getBarWidth(b.timeMs), height: '100%',
                    background: parseFloat(b.timeMs) < 5 ? '#10B981' : parseFloat(b.timeMs) < 20 ? '#F59E0B' : '#EF4444',
                    borderRadius: '4px', transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600 }}>Cypher:</span> <code style={{ background: 'var(--background)', padding: '2px 6px', borderRadius: '4px' }}>{b.query}</code>
                </div>
                <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px' }}>
                  <span style={{ fontWeight: 600 }}>SQL equivalent:</span> {b.sqlEquivalent}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Results: {b.resultCount} rows
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// Main Dashboard Page — Layout riêng biệt
// ============================================
export default function GraphDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9' }}>
      {/* Admin Top Bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#0F172A', borderBottom: '1px solid #334155',
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => navigate('/feed')} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
            padding: '8px 16px', color: '#94A3B8', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
            transition: 'all 0.2s'
          }}>
            <ArrowLeft size={16} /> Quay về Socily
          </button>
          <div style={{ width: '1px', height: '24px', background: '#334155' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={22} color="#E04F16" />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '18px' }}>FalkorDB Admin</span>
            <span style={{
              fontSize: '10px', background: '#E04F16', color: '#fff',
              padding: '2px 8px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase'
            }}>Graph DB</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Connected
          </div>
          <span style={{ color: '#94A3B8', fontSize: '13px' }}>Admin: <strong style={{ color: '#fff' }}>{user?.username || 'User'}</strong></span>
          <button onClick={handleLogout} style={{
            background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: '8px',
            padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center'
          }}>
            <LogOut size={16} color="#EF4444" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Hero Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)',
          borderRadius: '20px', padding: '40px', marginBottom: '32px', color: '#fff',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px',
            borderRadius: '50%', background: 'rgba(224,79,22,0.15)', filter: 'blur(40px)'
          }} />
          <div style={{
            position: 'absolute', bottom: '-30px', left: '30%', width: '150px', height: '150px',
            borderRadius: '50%', background: 'rgba(59,130,246,0.1)', filter: 'blur(40px)'
          }} />
          <div style={{ position: 'relative' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px', color: '#fff' }}>
              📊 Graph Database Dashboard
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '15px', maxWidth: '600px' }}>
              Trực quan hóa, phân tích hiệu suất và chứng minh sức mạnh của FalkorDB Graph Database
              trong ứng dụng mạng xã hội Socily.
            </p>
            <div style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 20px' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>Engine</div>
                <div style={{ fontWeight: 700, color: '#E04F16' }}>FalkorDB</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 20px' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>Query Language</div>
                <div style={{ fontWeight: 700, color: '#3B82F6' }}>Cypher</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 20px' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>Architecture</div>
                <div style={{ fontWeight: 700, color: '#10B981' }}>Index-free Adjacency</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <GraphStats />
          <GraphVisualization />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <CypherPlayground />
          <PerformanceBenchmark />
        </div>
      </div>
    </div>
  );
}

