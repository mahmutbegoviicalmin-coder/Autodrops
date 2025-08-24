import { useMemo } from 'react';

interface CategoryOption {
  id: string;
  name: string;
}

export interface FiltersState {
  priceMin: number;
  priceMax: number;
  minProfitMargin: number;
  maxDeliveryDays: number;
  categoryName: string; // empty means all
}

interface FiltersBarProps {
  categories: CategoryOption[];
  values: FiltersState;
  onChange: (next: FiltersState) => void;
  onClear: () => void;
}

export function FiltersBar({ categories, values, onChange, onClear }: FiltersBarProps) {
  const categoryNames = useMemo(() => categories.map(c => c.name), [categories]);

  const set = (patch: Partial<FiltersState>) => onChange({ ...values, ...patch });

  return (
    <div className="mb-6 p-4 rounded-xl border border-gray-700/50 bg-gray-900/60 backdrop-blur-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* Price Min */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Min Price ($)</label>
          <input
            type="number"
            className="w-full bg-gray-800/70 border border-gray-700/60 rounded-lg px-3 py-2 text-white"
            value={values.priceMin}
            min={0}
            onChange={(e) => set({ priceMin: Number(e.target.value || 0) })}
          />
        </div>
        {/* Price Max */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Max Price ($)</label>
          <input
            type="number"
            className="w-full bg-gray-800/70 border border-gray-700/60 rounded-lg px-3 py-2 text-white"
            value={values.priceMax}
            min={0}
            onChange={(e) => set({ priceMax: Number(e.target.value || 0) })}
          />
        </div>
        {/* Min Profit Margin */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Min Profit Margin (%)</label>
          <input
            type="number"
            className="w-full bg-gray-800/70 border border-gray-700/60 rounded-lg px-3 py-2 text-white"
            value={values.minProfitMargin}
            min={0}
            max={100}
            onChange={(e) => set({ minProfitMargin: Number(e.target.value || 0) })}
          />
        </div>
        {/* Max Delivery Days */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Max Shipping Time (days)</label>
          <input
            type="number"
            className="w-full bg-gray-800/70 border border-gray-700/60 rounded-lg px-3 py-2 text-white"
            value={values.maxDeliveryDays}
            min={1}
            onChange={(e) => set({ maxDeliveryDays: Number(e.target.value || 0) })}
          />
        </div>
        {/* Category */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Category</label>
          <select
            className="w-full bg-gray-800/70 border border-gray-700/60 rounded-lg px-3 py-2 text-white"
            value={values.categoryName}
            onChange={(e) => set({ categoryName: e.target.value })}
          >
            <option value="">All</option>
            {categoryNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-3 flex gap-3">
        <button
          onClick={onClear}
          className="px-3 py-2 rounded-lg border border-gray-700/60 text-gray-300 hover:bg-gray-800/60"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
} 