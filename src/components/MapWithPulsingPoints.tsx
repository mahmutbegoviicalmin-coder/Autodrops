import React from 'react';

type Point = { id: number; top: string; left: string; label: string };

interface MapWithPulsingPointsProps {
  mapSrc?: string;
  points?: Point[];
}

const defaultPoints: Point[] = [
  { id: 1, top: '18%', left: '24%', label: 'Vancouver' },
  { id: 2, top: '32%', left: '45%', label: 'Los Angeles' },
  { id: 3, top: '28%', left: '70%', label: 'New York' },
  { id: 4, top: '41%', left: '56%', label: 'London' },
  { id: 5, top: '52%', left: '63%', label: 'Cairo' },
  { id: 6, top: '60%', left: '78%', label: 'Mumbai' },
  { id: 7, top: '72%', left: '86%', label: 'Sydney' },
];

function pctToNum(p: string): number {
  const v = parseFloat(String(p).replace('%', ''));
  return isNaN(v) ? 0 : v;
}

export function MapWithPulsingPoints({ mapSrc = '/map.svg', points = defaultPoints }: MapWithPulsingPointsProps) {
  return (
    <div className="relative w-full max-w-6xl mx-auto select-none">
      <img src={mapSrc} alt="World map" className="w-full h-auto select-none pointer-events-none" />
      {points.map((p, idx) => {
        const topNum = pctToNum(p.top);
        const placeBelow = topNum < 15; // ako je previsoko gore, tooltip ide ispod
        // Bolje pozicioniranje labela na osnovu pozicije na mapi
        const getLabelSide = (left: number, top: number) => {
          if (top < 15) return 'below';
          if (top > 85) return 'above';
          if (left < 25) return 'right';
          if (left > 75) return 'left';
          return idx % 2 === 0 ? 'left' : 'right';
        };
        
        const side = getLabelSide(pctToNum(p.left), topNum);
        const delay = (idx % 8) * 0.3; // sporiji i razbijen delay
        return (
          <div
            key={p.id}
            className={`cpoint group`}
            style={{ top: p.top, left: p.left, ['--delay' as any]: `${delay}s` }}
          >
            <span className="cpoint__ring cpoint__ring--a" />
            <span className="cpoint__ring cpoint__ring--b" />
            <span className="cpoint__core" />
            <div
              className={`cpoint__label ${placeBelow ? 'cpoint__label--below' : 'cpoint__label--above'} ${
                side === 'left' ? 'cpoint__label--left' : 'cpoint__label--right'
              }`}
            >
              {p.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MapWithPulsingPoints;


