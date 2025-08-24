import { useEffect, useMemo, useRef, useState } from 'react';
import { Megaphone, Globe, Search, Settings, Key, Loader2, ExternalLink, AlertCircle } from 'lucide-react';

type FbAd = {
  id: string;
  ad_creation_time?: string;
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  ad_active_status?: string;
  ad_snapshot_url?: string;
  page_name?: string;
  page_id?: string;
  publisher_platforms?: string[];
  impressions?: string;
  spend?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_descriptions?: string[];
  ad_creative_link_titles?: string[];
};

const COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'DE', label: 'Germany' },
  { code: 'AU', label: 'Australia' },
];

export function FbAdsLibrary(): JSX.Element {
  const [accessToken, setAccessToken] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [query, setQuery] = useState('hoodie');
  const [country, setCountry] = useState('US');
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'audience_network' | 'messenger' | 'all'>('all');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ads, setAds] = useState<FbAd[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('fb_ads_token') || '';
    if (saved) setAccessToken(saved);
  }, []);

  const saveToken = () => {
    localStorage.setItem('fb_ads_token', accessToken);
    setIsSettingsOpen(false);
  };

  const apiBase = useMemo(() => 'https://graph.facebook.com/v19.0', []);

  const loadAds = async () => {
    if (!accessToken) {
      setIsSettingsOpen(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('access_token', accessToken);
      params.set('search_terms', query);
      params.set('ad_active_status', status);
      params.set('ad_type', 'ALL');
      params.set('ad_reached_countries', `["${country}"]`);
      if (platform !== 'all') params.set('publisher_platforms', `["${platform}"]`);
      params.set('fields', [
        'id',
        'ad_creation_time',
        'ad_delivery_start_time',
        'ad_delivery_stop_time',
        'ad_active_status',
        'ad_snapshot_url',
        'page_name',
        'page_id',
        'publisher_platforms',
        'impressions',
        'spend',
        'ad_creative_bodies',
        'ad_creative_link_captions',
        'ad_creative_link_descriptions',
        'ad_creative_link_titles',
      ].join(','));
      params.set('limit', '25');

      const url = `${apiBase}/ads_archive?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Facebook API error');
      setAds(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setError((e as Error).message || 'Greška pri dohvatu Facebook Ads Library.');
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6">
      <div className="bg-gray-900/60 border border-gray-700/60 rounded-2xl p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Megaphone className="w-5 h-5 text-purple-400" /> Facebook Ads Library
          </div>
          <button
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
            onClick={() => setIsSettingsOpen((s) => !s)}
            title="Postavke"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {isSettingsOpen && (
          <div className="px-4 py-3 border border-gray-700/60 rounded-xl mb-4 bg-gray-900">
            <label className="text-sm text-gray-300 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-yellow-400" /> Facebook Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Zalijepi svoj access token (čuva se lokalno)"
              className="w-full premium-input rounded-lg px-3 py-2"
            />
            <div className="flex justify-end mt-2">
              <button onClick={saveToken} className="premium-button px-3 py-1.5 rounded-lg text-sm">Sačuvaj</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white mb-1">Pojam</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                className="premium-input w-full rounded-xl pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="npr. hoodie, gym, yoga"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Država</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                className="premium-input rounded-xl pl-10 pr-8 py-2"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Platforma</label>
            <select className="premium-input rounded-xl py-2" value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
              <option value="all">All</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="audience_network">Audience Network</option>
              <option value="messenger">Messenger</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button onClick={loadAds} className="premium-button px-5 py-2 rounded-xl flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Pretraži
          </button>
          {error && (
            <div className="text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-gray-900/60 border border-gray-700/60 rounded-xl p-4">
              <div className="text-sm text-gray-300 mb-2 font-semibold">{ad.page_name || 'Unknown Page'}</div>
              {ad.ad_creative_link_titles?.[0] && (
                <div className="text-white text-sm mb-1">{ad.ad_creative_link_titles[0]}</div>
              )}
              {ad.ad_creative_bodies?.[0] && (
                <div className="text-gray-400 text-xs mb-2">{ad.ad_creative_bodies[0]}</div>
              )}
              <div className="text-xs text-gray-500 mb-2">
                Platforms: {(ad.publisher_platforms || []).join(', ') || '—'}
              </div>
              <div className="flex items-center justify-between mt-2">
                <a
                  href={ad.ad_snapshot_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-sm inline-flex items-center gap-1"
                >
                  Open Snapshot <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-xs text-gray-500">{ad.ad_active_status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}




