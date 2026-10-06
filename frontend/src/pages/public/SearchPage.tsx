import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { itemService } from '../../services/itemService';
import { LostItem, FoundItem, Category, CampusLocation } from '../../types';
import { ItemCard } from '../../components/items/ItemCard';
import { Search, Filter, Tag, MapPin, RefreshCw, X } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>(
    initialTab as any
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedLocation, setSelectedLocation] = useState<number | ''>('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<CampusLocation[]>([]);

  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadItems();
  }, [selectedCategory, selectedLocation, activeTab]);

  const loadFilters = async () => {
    try {
      const [cats, locs] = await Promise.all([
        itemService.getCategories(),
        itemService.getLocations(),
      ]);
      setCategories(cats);
      setLocations(locs);
    } catch (e) {}
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedLocation) params.location_id = selectedLocation;

      const [lost, found] = await Promise.all([
        itemService.searchLost(params),
        itemService.searchFound(params),
      ]);
      setLostItems(Array.isArray(lost) ? lost : []);
      setFoundItems(Array.isArray(found) ? found : []);
    } catch (e) {
      setLostItems([]);
      setFoundItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadItems();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
  };

  const displayedItems = [
    ...(activeTab === 'all' || activeTab === 'lost'
      ? lostItems.map((item) => ({ item, type: 'lost' as const }))
      : []),
    ...(activeTab === 'all' || activeTab === 'found'
      ? foundItems.map((item) => ({ item, type: 'found' as const }))
      : []),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Browse Campus Lost & Found
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Search items across campus. Private distinguishing characteristics are sanitized.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, brand, color (e.g. 'Sony Headphones', 'Brown Wallet')..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 focus:bg-white outline-none transition"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-sky-600/20"
          >
            <Search className="w-4 h-4" /> Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              All Items ({lostItems.length + foundItems.length})
            </button>
            <button
              onClick={() => setActiveTab('found')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'found' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Found Items ({foundItems.length})
            </button>
            <button
              onClick={() => setActiveTab('lost')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'lost' ? 'bg-white text-rose-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Lost Items ({lostItems.length})
            </button>
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none focus:border-sky-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value ? Number(e.target.value) : '')}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none focus:border-sky-500"
            >
              <option value="">All Locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            {(selectedCategory || selectedLocation || searchQuery) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold flex items-center gap-1 transition"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Results */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-300" />
          Loading campus reports...
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">No reports matched your filters</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or clearing the category and location filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedItems.map(({ item, type }) => (
            <ItemCard key={`${type}-${item.id}`} item={item} type={type} />
          ))}
        </div>
      )}
    </div>
  );
};
