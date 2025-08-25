import { useEffect, useState } from 'react';
import { CheckCircle, Shield, Loader2, LogIn } from 'lucide-react';

interface AdminAffiliatePanelProps {
  backendUrl?: string; // http://localhost:3000
}

export function AdminAffiliatePanel({ backendUrl = 'http://localhost:3000' }: AdminAffiliatePanelProps) {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Login failed');
      setToken(data.token);
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  };

  const loadPending = async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/admin/pending`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch');
      setPending(data);
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  };

  const approve = async (id: number) => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/admin/approve/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Approve failed');
      await loadPending();
      alert('Approved');
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  };

  useEffect(() => { if (token) loadPending(); }, [token]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-2 text-white text-xl font-bold"><Shield className="w-5 h-5 text-blue-400"/> Affiliate Admin Panel</div>
      {!token ? (
        <div className="bg-gray-900/60 border border-gray-700/60 rounded-2xl p-4 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="premium-input rounded-lg px-3 py-2" placeholder="admin email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input type="password" className="premium-input rounded-lg px-3 py-2" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
            <button onClick={login} disabled={loading} className="premium-button rounded-lg px-4 py-2 flex items-center justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><LogIn className="w-4 h-4 mr-2"/>Login</>}
            </button>
          </div>
          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
        </div>
      ) : (
        <div className="bg-gray-900/60 border border-gray-700/60 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white font-semibold">Pending Applications</div>
            <button onClick={loadPending} className="premium-button px-3 py-1 rounded-lg text-sm">Refresh</button>
          </div>
          {loading ? <div className="text-gray-300 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Loading...</div> : (
            <div className="space-y-2">
              {pending.length === 0 ? <div className="text-gray-400 text-sm">No pending affiliates.</div> : pending.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-gray-800/50 border border-gray-700/60 rounded-xl p-3">
                  <div className="text-gray-200 text-sm">
                    <div className="font-semibold">{p.User?.name} <span className="text-gray-400">({p.User?.email})</span></div>
                    <div className="text-xs text-gray-400">Applied: {new Date(p.created_at).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => approve(p.id)} className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-1"><CheckCircle className="w-4 h-4"/>Approve</button>
                </div>
              ))}
            </div>
          )}
          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
        </div>
      )}
    </div>
  );
}



