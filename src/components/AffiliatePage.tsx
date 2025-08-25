import { useMemo, useState } from 'react';
import { Gift, Rocket, Users, DollarSign, CheckCircle, Copy, Check, Shield, ShoppingBag, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AffiliatePageProps {
  onApply?: () => void;
  onSignIn?: () => void;
}

export function AffiliatePage({ onApply, onSignIn }: AffiliatePageProps): JSX.Element {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralLink = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://autodrops.com';
    return user ? `${origin}?ref=${encodeURIComponent(user.id)}` : '';
  }, [user]);

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {}
  };

  return (
    <div className="relative">
      {/* Public Header */}
      <nav className="relative flex items-center justify-between px-6 py-4 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <button onClick={() => (window.location.href = '/')} className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25" aria-label="Home">
            <ShoppingBag className="w-6 h-6 text-white" />
          </button>
          <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            AutoDrops
          </span>
          <div className="flex items-center space-x-1">
            <span className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1 rounded-full font-medium animate-pulse">
              PRO
            </span>
            <Crown className="w-4 h-4 text-yellow-400 animate-bounce" />
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <button onClick={() => document.getElementById('pricing-title')?.scrollIntoView({ behavior: 'smooth' })} className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 font-medium">
            Pricing
          </button>
          <button className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 font-medium">
            Community
          </button>
          <div className="flex items-center space-x-3">
            <button onClick={onSignIn} className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 font-medium px-4 py-2 rounded-lg border border-gray-600 hover:border-gray-400">
              Sign In
            </button>
            <button onClick={onApply} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              Sign Up Free
            </button>
          </div>
        </div>
      </nav>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <span className="inline-flex items-center space-x-2 aff-badge rounded-full px-5 py-2 mb-6 text-purple-200">
              <Rocket className="w-4 h-4 aff-rocket" />
              <span>Become an Affiliate</span>
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">Earn recurring commissions by promoting AutoDrops</h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Share AutoDrops with your audience and earn up to 40% monthly on every active subscription you refer.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button onClick={onApply} className="aff-cta px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2">
                <Rocket className="w-4 h-4" /> Apply Now
              </button>
              <button onClick={() => document.getElementById('tiers-section')?.scrollIntoView({ behavior: 'smooth' })} className="px-6 py-3 rounded-xl border border-gray-600/60 text-gray-200 hover:bg-gray-800/50 transition-colors">
                Learn more
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-6">
        {[{
          icon: <DollarSign className="w-6 h-6 text-green-400" />,
          title: 'Recurring commission',
          desc: 'Earn every month while the customer subscription remains active.'
        },{
          icon: <Users className="w-6 h-6 text-blue-400" />,
          title: '30-day cookie',
          desc: 'If a user converts within 30 days, the commission is attributed to you.'
        },{
          icon: <Gift className="w-6 h-6 text-purple-400" />,
          title: 'Promo materials',
          desc: 'Ready banners, copy and visuals to help you start fast.'
        }].map((f, i) => (
          <div key={i} className="bg-gray-900/60 border border-gray-700/60 rounded-2xl p-6 backdrop-blur-sm shadow-soft hover:shadow-soft-strong transition-shadow">
            <div className={`mb-3 aff-float`} style={{ animationDelay: `${i * 0.2}s` }}>{f.icon}</div>
            <div className="text-white font-semibold mb-1">{f.title}</div>
            <div className="text-gray-400 text-sm">{f.desc}</div>
          </div>
        ))}
      </section>

      {/* Tiers */}
      <section id="tiers-section" className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-white mb-6">Commission Tiers</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[{
            name: 'Starter', percent: 20, perks: ['Up to 25 active subs', 'Monthly payouts', 'Promo materials']
          },{
            name: 'Growth', percent: 30, perks: ['25–100 active subs', 'Priority support', 'Custom UTM link']
          },{
            name: 'Pro', percent: 40, perks: ['100+ active subs', 'Special campaigns', 'Co‑marketing']
          }].map((t, i) => (
            <div key={i} className={`rounded-2xl p-6 border ${i===2 ? 'border-purple-500/50 bg-gradient-to-br from-purple-700/10 to-blue-700/10' : 'border-gray-700/60 bg-gray-900/60'} backdrop-blur-sm hover:translate-y-[-4px] transition-transform duration-300 shadow-soft hover:shadow-soft-strong`}>
              <div className="text-white text-xl font-bold mb-2">{t.name}</div>
              <div className="text-4xl font-extrabold text-white mb-4">{t.percent}%</div>
              <ul className="text-gray-300 text-sm space-y-2">
                {t.perks.map((p, idx) => (
                  <li key={idx} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400 aff-float" style={{ animationDelay: `${idx * 0.15}s` }} /> {p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA / Referral */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gray-900/60 border border-gray-700/60 rounded-2xl p-6 backdrop-blur-sm shadow-soft">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-white font-semibold mb-1">Your referral link</div>
              {user ? (
                <div className="flex items-center gap-2">
                  <code className="text-purple-300 bg-gray-800/80 border border-gray-700/60 rounded-lg px-3 py-2 text-sm">
                    {referralLink}
                  </code>
                  <button onClick={copyLink} className="premium-button px-3 py-2 rounded-lg text-sm inline-flex items-center gap-1">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">Sign in or create an account to get your referral link.</div>
              )}
            </div>
            <div className="text-right">
              <button onClick={onApply} className="premium-button px-5 py-3 rounded-xl inline-flex items-center gap-2">
                <Users className="w-4 h-4" />
                {user ? 'Start Promoting' : 'Apply to Affiliate'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h3 className="text-xl font-bold text-white mb-4">FAQ</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {[{
            q: 'How is my commission tracked?',
            a: 'With your unique referral link (30-day cookie window) and a reporting dashboard (coming soon).'
          },{
            q: 'When do payouts happen?',
            a: 'Monthly, after the refund period ends for all referrals from the previous month.'
          },{
            q: 'Can I run paid ads?',
            a: 'Yes, but no bidding on AutoDrops branded keywords and no misleading advertising.'
          },{
            q: 'Any content restrictions?',
            a: 'No spam and no policy violations (Meta/Google). We reserve the right to terminate abusive accounts.'
          }].map((f, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-700/60 rounded-2xl p-5 text-gray-300 backdrop-blur-sm shadow-soft">
              <div className="text-white font-semibold mb-1">{f.q}</div>
              <div className="text-sm">{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Terms */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="bg-gray-900/60 border border-gray-700/60 rounded-2xl p-6 text-gray-300 backdrop-blur-sm shadow-soft">
          <div className="flex items-center gap-2 text-white font-semibold mb-2"><Shield className="w-4 h-4 text-blue-400" /> Program Terms (summary)</div>
          <ul className="list-disc ml-5 text-sm space-y-1">
            <li>Recurring commission is calculated on active subscriptions.</li>
            <li>Cookie window: 30 days. If the user converts within the window, you get credit.</li>
            <li>Payouts are monthly. Fraudulent traffic and spam are prohibited.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}


