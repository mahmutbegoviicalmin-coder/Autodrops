import React, { useEffect, useMemo, useRef, useState } from 'react';

type SaleEvent = {
  id: number;
  leftPct: number; // 0-100
  topPct: number;  // 0-100
  amount: number;  // dollars
  createdAt: number;
  labelSide: 'left' | 'right' | 'top' | 'bottom'; // za bolje pozicioniranje
};

// Predefinisane tačke (ograničene na realne regione sa slike)
const PRESET_POINTS: Array<[number, number, number]> = [
  // left%, top%, amount
  [19, 34, 27], // zapadna Kanada
  [25, 38, 31], // SAD sjever
  [28, 52, 24], // Meksiko
  [34, 74, 23], // Brazil
  [46, 31, 41], // UK/Skandinavija
  [49, 45, 27], // Central EU
  [55, 48, 26], // Balkan
  [63, 52, 20], // Bliski istok/Indija
  [73, 60, 32], // Indonezija
  [82, 75, 40], // Australija
  [88, 28, 21], // Japan
];

export function GlobalSalesPulse() {
  const [events, setEvents] = useState<SaleEvent[]>([]);
  const idRef = useRef(0);

  // Funkcija za određivanje najbolje pozicije labela
  const getBestLabelPosition = (leftPct: number, topPct: number): 'left' | 'right' | 'top' | 'bottom' => {
    // Logika za pozicioniranje na osnovu pozicije na mapi
    if (topPct < 20) return 'bottom'; // gore na mapi
    if (topPct > 80) return 'top'; // dole na mapi
    if (leftPct < 30) return 'right'; // levo na mapi
    if (leftPct > 70) return 'left'; // desno na mapi
    
    // Za srednje pozicije, izmjenjuj levo/desno
    return Math.random() > 0.5 ? 'left' : 'right';
  };

  // Preload a few events
  useEffect(() => {
    const now = Date.now();
    const initial = PRESET_POINTS.map(([l, t, a]) => ({ 
      id: idRef.current++, 
      leftPct: l, 
      topPct: t, 
      amount: a, 
      createdAt: now,
      labelSide: getBestLabelPosition(l, t)
    }));
    setEvents(initial);
  }, []);

  // Random events generator
  useEffect(() => {
    const intervalMs = 800; // sporiji interval za manje preklapanja
    const lifeMs = 2500;    // duži glow
    const timer = setInterval(() => {
      setEvents((prev) => {
        // biraj nasumično neku od predefinisnih tačaka, plus mali jitter
        const [l, t, a] = PRESET_POINTS[Math.floor(Math.random() * PRESET_POINTS.length)];
        const jitter = (v: number, j: number) => Math.max(6, Math.min(94, v + (Math.random() - 0.5) * j));
        const left = jitter(l, 2.5);
        const top = jitter(t, 2.5);
        const amount = a + Math.floor(Math.random() * 5 - 2);
        const now = Date.now();
        
        const next: SaleEvent = { 
          id: idRef.current++, 
          leftPct: left, 
          topPct: top, 
          amount: Math.max(8, amount), 
          createdAt: now,
          labelSide: getBestLabelPosition(left, top)
        };
        
        const fresh = prev.filter((e) => now - e.createdAt < lifeMs);
        
        // Smanjeno burst-ovanje za manje preklapanja
        if (Math.random() < 0.3) {
          const [l2, t2, a2] = PRESET_POINTS[Math.floor(Math.random() * PRESET_POINTS.length)];
          const left2 = jitter(l2, 2);
          const top2 = jitter(t2, 2);
          const next2: SaleEvent = { 
            id: idRef.current++, 
            leftPct: left2, 
            topPct: top2, 
            amount: a2, 
            createdAt: now,
            labelSide: getBestLabelPosition(left2, top2)
          };
          return [...fresh, next, next2];
        }
        return [...fresh, next];
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto text-center">
        <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">Start selling in a rapidly</h3>
        <h3 className="text-3xl md:text-4xl font-bold text-white mb-8">growing industry</h3>
        <div className="relative w-full h-[420px] md:h-[520px] bg-white/[0.02] rounded-3xl overflow-hidden border border-white/10">
          {/* Background map as gray image for contrast */}
          {/* Place your provided map as public/world-map.png; we gray it via CSS filter */}
          <img src="/world-map.png" alt="World map" className="absolute inset-0 w-full h-full object-contain opacity-30 brightness-125 grayscale pointer-events-none z-0" />

          {/* Sales events */}
          {events.map((e) => {
            // Dinamično pozicioniranje labela na osnovu labelSide
            const getLabelClasses = (side: string) => {
              const baseClasses = "absolute text-[10px] md:text-[11px] font-medium text-blue-200/95 bg-slate-900/80 px-2 py-1 rounded-md backdrop-blur-sm border border-blue-400/20 whitespace-nowrap";
              switch (side) {
                case 'top': return `${baseClasses} -top-8 left-1/2 -translate-x-1/2`;
                case 'bottom': return `${baseClasses} top-6 left-1/2 -translate-x-1/2`;
                case 'left': return `${baseClasses} -left-16 top-1/2 -translate-y-1/2`;
                case 'right': return `${baseClasses} -right-16 top-1/2 -translate-y-1/2`;
                default: return `${baseClasses} -top-7 -left-6`;
              }
            };
            
            return (
              <div
                key={e.id}
                className="absolute select-none pointer-events-none z-[1]"
                style={{ left: `${e.leftPct}%`, top: `${e.topPct}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="relative">
                  <span className={getLabelClasses(e.labelSide)}>
                    ${e.amount} Sale
                  </span>
                  <span className="sale-wave" />
                  <span className="sale-wave2" />
                  <span className="sale-wave3" />
                  <span className="sale-core" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


