import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemService } from '../../services/itemService';
import { Category, CampusLocation } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { CheckCircle, ShieldCheck, AlertTriangle, Shield, MapPin, Tag } from 'lucide-react';

export const ReportFoundPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    location_id: '',
    description: '',
    found_date: new Date().toISOString().split('T')[0],
    approx_time: '3:00 PM',
    brand: '',
    color: '',
    has_item: true, // Must remain true (finder keeps item)
    distinguishing_features: '',
  });

  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const { success, error, warning } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [cats, locs] = await Promise.all([
        itemService.getCategories(),
        itemService.getLocations(),
      ]);
      setCategories(cats);
      setLocations(locs);
      if (cats.length > 0) setFormData((prev) => ({ ...prev, category_id: String(cats[0].id) }));
      if (locs.length > 0) setFormData((prev) => ({ ...prev, location_id: String(locs[0].id) }));
    } catch (e) {}
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent, force = false) => {
    e.preventDefault();
    if (!formData.has_item) {
      error("In CampusFind, the finder retains the item safely until direct handover to the owner.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        category_id: Number(formData.category_id),
        location_id: Number(formData.location_id),
        description: formData.description.trim(),
        found_date: formData.found_date,
        approx_time: formData.approx_time.trim(),
        brand: formData.brand.trim() || undefined,
        color: formData.color.trim() || undefined,
        has_item: true,
        distinguishing_features: formData.distinguishing_features.trim() || undefined,
      };

      const res = await itemService.reportFound(payload, force);
      success('Found report logged! You will be notified when a matching owner sends a verification request.');
      navigate(`/found/${res.id}`);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setDuplicateWarning(err.response.data.detail);
        warning('Potential duplicate report detected.');
      } else {
        error(err.response?.data?.detail || 'Failed to submit found item report.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">
            Found Property Submission
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Report a Found Item
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thank you for helping our campus community! Please hold onto the item safely until the verified owner is identified.
          </p>
        </div>

        {/* Finder Retention Policy Alert Box */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            <span className="font-bold block text-sm mb-0.5">
              The Finder Retains the Item
            </span>
            CampusFind does not store items at security desks. You will keep the item safely in your possession until you and the verified owner schedule a campus meeting for handover.
          </div>
        </div>

        {duplicateWarning && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Similar Found Report Exists</h4>
                <p className="text-xs text-amber-800 mt-0.5">{duplicateWarning}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex-shrink-0"
            >
              Continue Anyway
            </button>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Item Details
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Item Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Black Sony Over-Ear Headphones"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 focus:bg-white outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select
                  name="category_id"
                  required
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Found Location *</label>
                <select
                  name="location_id"
                  required
                  value={formData.location_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 outline-none"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.zone_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date Found *</label>
                <input
                  type="date"
                  name="found_date"
                  required
                  value={formData.found_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Approximate Time Found</label>
                <input
                  type="text"
                  name="approx_time"
                  value={formData.approx_time}
                  onChange={handleChange}
                  placeholder="e.g. 2:40 PM, After 3rd Period"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Public Description *</label>
              <textarea
                name="description"
                required
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Where was it found? Keep unique private details (like serial numbers or stickers) secret to prevent false claims!"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 outline-none leading-relaxed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand (if visible)</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. Sony, Apple"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="e.g. Black"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          {/* Private Distinguishing Feature Note */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Private Verification Clue (Hidden from Public)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Note any hidden characteristic (e.g. "Sticker inside case", "Card name") so you can ask the claiming owner to describe it during verification.
            </p>
            <input
              type="text"
              name="distinguishing_features"
              value={formData.distinguishing_features}
              onChange={handleChange}
              placeholder="e.g. Unique sticker inside, scratch on left side"
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:border-sky-500 outline-none"
            />
          </div>

          {/* Mandatory Finder Retention Affirmation Checkbox */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-2xl flex items-center gap-3">
            <input
              type="checkbox"
              id="has_item"
              name="has_item"
              checked={formData.has_item}
              onChange={handleChange}
              className="w-5 h-5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="has_item" className="text-xs font-bold text-emerald-950 cursor-pointer">
              I confirm: "I currently have this item and will keep it safe until verified handover."
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.has_item}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting & Searching Matches...' : 'Submit Found Report'}
          </button>
        </form>
      </div>
    </div>
  );
};
