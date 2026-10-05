import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemService } from '../../services/itemService';
import { Category, CampusLocation } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { PlusCircle, AlertTriangle, Shield, MapPin, Tag, Calendar, Clock, Check } from 'lucide-react';

export const ReportLostPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    location_id: '',
    description: '',
    lost_date: new Date().toISOString().split('T')[0],
    approx_time: '2:00 PM',
    brand: '',
    model: '',
    color: '',
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent, force = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        category_id: Number(formData.category_id),
        location_id: Number(formData.location_id),
        description: formData.description.trim(),
        lost_date: formData.lost_date,
        approx_time: formData.approx_time.trim(),
        brand: formData.brand.trim() || undefined,
        model: formData.model.trim() || undefined,
        color: formData.color.trim() || undefined,
        distinguishing_features: formData.distinguishing_features.trim() || undefined,
      };

      const res = await itemService.reportLost(payload, force);
      success('Lost item report submitted! Matching engine running in background.');
      navigate(`/lost/${res.id}`);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setDuplicateWarning(err.response.data.detail);
        warning('Potential duplicate report detected.');
      } else {
        error(err.response?.data?.detail || 'Failed to submit lost item report.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">
        <div>
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest block mb-1">
            Lost Property Submission
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Report a Lost Item
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            CampusFind will instantly calculate deterministic match candidates against active found items.
          </p>
        </div>

        {/* Duplicate warning modal alert */}
        {duplicateWarning && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Similar Report Already Exists</h4>
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
          {/* Required Fields */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Required Information
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
                placeholder="e.g. Black Sony WH-1000XM5 Noise Canceling Headphones"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 focus:bg-white outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category *
                </label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Approximate Lost Location *
                </label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date Lost *
                </label>
                <input
                  type="date"
                  name="lost_date"
                  required
                  value={formData.lost_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Approximate Time Lost
                </label>
                <input
                  type="text"
                  name="approx_time"
                  value={formData.approx_time}
                  onChange={handleChange}
                  placeholder="e.g. 2:30 PM, Morning lecture"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description & Circumstances *
              </label>
              <textarea
                name="description"
                required
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Where were you sitting? Any exterior details or accessories?"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Optional Details */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Optional Identifying Attributes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. Sony, Apple, Fossil"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g. WH-1000XM5"
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
                  placeholder="e.g. Matte Black"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-sky-500 outline-none"
                />
              </div>
            </div>

            {/* Distinguishing Characteristics - Privacy Safe */}
            <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                <Shield className="w-4 h-4 text-sky-600" />
                <span>Distinguishing Characteristics (Private & Protected)</span>
              </div>
              <p className="text-[11px] text-sky-800 leading-snug">
                This will <strong>NEVER</strong> be displayed publicly. It is used during the private ownership verification challenge when coordinating with the finder.
              </p>
              <textarea
                name="distinguishing_features"
                rows={2}
                value={formData.distinguishing_features}
                onChange={handleChange}
                placeholder="e.g. Small cyan sticker on inside zipper, tiny scratch near left hinge, key engraved with '204'"
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-rose-600/25 transition flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting & Running Matching Engine...' : 'Submit Lost Report'}
          </button>
        </form>
      </div>
    </div>
  );
};
