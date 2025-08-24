import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface AffiliateApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendUrl?: string; // default http://localhost:3000
}

export function AffiliateApplyModal({ isOpen, onClose, backendUrl = 'http://localhost:3000' }: AffiliateApplyModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/affiliate/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Registration failed');
      alert('Application submitted! We will review and approve soon.');
      setName(''); setEmail(''); setPassword('');
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900/90 border border-gray-700/60 rounded-2xl shadow-2xl">
        <div className="p-4 border-b border-gray-700/60 flex items-center justify-between">
          <h3 className="text-white font-semibold">Apply to Affiliate Program</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Full name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="premium-input w-full rounded-lg px-3 py-2" placeholder="John Doe" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="premium-input w-full rounded-lg px-3 py-2" placeholder="john@example.com" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="premium-input w-full rounded-lg px-3 py-2" placeholder="••••••••" required />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button disabled={loading} className="w-full premium-button py-2 rounded-lg flex items-center justify-center">
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin mr-2"/>Submitting...</>) : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}




