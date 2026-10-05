import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { itemService } from '../../services/itemService';
import { caseService } from '../../services/caseService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { LostItem, FoundItem, Match } from '../../types';
import { MatchCard } from '../../components/matches/MatchCard';
import {
  Compass,
  MapPin,
  Calendar,
  Tag,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Lock,
  RefreshCw,
} from 'lucide-react';

interface ItemDetailPageProps {
  type: 'lost' | 'found';
}

export const ItemDetailPage: React.FC<ItemDetailPageProps> = ({ type }) => {
  const { id } = useParams<{ id: string }>();
  const itemId = Number(id);
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [item, setItem] = useState<LostItem | FoundItem | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const isFound = type === 'found';

  useEffect(() => {
    loadData();
  }, [itemId, type]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isFound) {
        const found = await itemService.getFoundById(itemId);
        setItem(found);
        if (user && (user.id === found.finder_id || user.role !== 'STUDENT')) {
          const m = await caseService.getMatchesForFound(itemId);
          setMatches(m);
        }
      } else {
        const lost = await itemService.getLostById(itemId);
        setItem(lost);
        if (user && (user.id === lost.owner_id || user.role !== 'STUDENT')) {
          const m = await caseService.getMatchesForLost(itemId);
          setMatches(m);
        }
      }
    } catch (err: any) {
      error(err.response?.data?.detail || 'Item report not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = async (match: Match) => {
    setRequesting(true);
    try {
      const res = await caseService.requestVerification(match.lost_item_id, match.found_item_id);
      success('Verification request sent to finder! Redirecting to case coordination...');
      navigate(`/cases/${res.id}`);
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to request verification.');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-300" />
        Loading item report details...
      </div>
    );
  }

  if (!item) return null;

  const itemDate = isFound ? (item as FoundItem).found_date : (item as LostItem).lost_date;
  const isOwner = !isFound && user?.id === (item as LostItem).owner_id;
  const isFinder = isFound && user?.id === (item as FoundItem).finder_id;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Main Item Detail Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                isFound
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {isFound ? 'Found Property Report' : 'Lost Property Report'}
            </span>
            <span className="text-xs text-slate-400">Report #{item.id}</span>
          </div>

          <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 rounded-full text-slate-700">
            Status: {item.status}
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {item.title}
          </h1>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed max-w-3xl">
            {item.description}
          </p>
        </div>

        {/* Finder Retention Notice */}
        {isFound && (
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="text-xs text-emerald-950 font-medium leading-relaxed">
              <span className="font-bold">Finder Retains Possession:</span> The student finder currently has this item safely in hand and will return it in person following CampusFind verification.
            </div>
          </div>
        )}

        {/* Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold mb-0.5">Category</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              {item.category?.name || 'General'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold mb-0.5">
              {isFound ? 'Found Location' : 'Approx Lost Location'}
            </span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {item.location?.name}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold mb-0.5">Date</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(itemDate).toLocaleDateString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold mb-0.5">Approx Time</span>
            <span className="font-bold text-slate-800">
              {item.approx_time || 'Not specified'}
            </span>
          </div>
        </div>

        {/* Brand & Model */}
        {(item.brand || (item as any).model || item.color) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {item.brand && (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg">
                Brand: {item.brand}
              </span>
            )}
            {(item as any).model && (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg">
                Model: {(item as any).model}
              </span>
            )}
            {item.color && (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg">
                Color: {item.color}
              </span>
            )}
          </div>
        )}

        {/* Private Distinguishing Feature (Only for report creator) */}
        {item.distinguishing_features && (
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-1">
            <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-sky-600" />
              Your Private Verification Feature (Never shared publicly)
            </span>
            <p className="text-xs text-sky-800">{item.distinguishing_features}</p>
          </div>
        )}
      </div>

      {/* Suggested Possible Matches Section */}
      {(isOwner || isFinder) && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-600" />
                Deterministic Match Candidates ({matches.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated by CampusFind weighted algorithm. Remember: labeled strictly as <strong>Possible Match</strong>.
              </p>
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No potential matches meeting the threshold found yet.
              <p className="mt-1">
                The matching engine runs automatically whenever a new report is submitted.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  onRequestVerification={handleRequestVerification}
                  isLoading={requesting}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
