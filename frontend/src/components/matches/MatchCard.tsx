import React, { useState } from 'react';
import { Match } from '../../types';
import { Sparkles, MapPin, Calendar, Check, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  onRequestVerification: (match: Match) => void;
  isLoading?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onRequestVerification,
  isLoading = false,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Score color gradient
  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    if (score >= 60) return 'bg-sky-50 text-sky-800 border-sky-300';
    return 'bg-amber-50 text-amber-800 border-amber-300';
  };

  const found = match.found_item;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition">
      <div className="p-5">
        {/* Match Header with STRICT "Possible Match" label */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Possible Match
            </span>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getScoreBadgeColor(
              match.match_score
            )}`}
          >
            {match.match_score}% Confidence
          </div>
        </div>

        {/* Found Item Summary */}
        {found && (
          <div>
            <h4 className="font-bold text-base text-slate-900 mb-1">{found.title}</h4>
            <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
              {found.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {found.location && (
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{found.location.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{new Date(found.found_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Accordion toggle for deterministic match factors */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-between py-1 mb-2 transition"
        >
          <span>Deterministic Factor Breakdown</span>
          {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showBreakdown && (
          <div className="space-y-2 mb-4 p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs">
            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                <span>Category Match (25% weight)</span>
                <span>{match.category_score}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full"
                  style={{ width: `${match.category_score}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                <span>Location Proximity (20% weight)</span>
                <span>{match.location_score}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full"
                  style={{ width: `${match.location_score}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                <span>Date Proximity (20% weight)</span>
                <span>{match.date_score}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full"
                  style={{ width: `${match.date_score}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                <span>Keyword Token Overlap (15% weight)</span>
                <span>{match.keyword_score}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full"
                  style={{ width: `${match.keyword_score}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                <span>Brand & Color Correlation (15% weight)</span>
                <span>{Math.round((match.brand_score + match.color_score) / 2)}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full"
                  style={{ width: `${Math.round((match.brand_score + match.color_score) / 2)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {match.status === 'REQUESTED' ? (
          <div className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            Verification Requested
          </div>
        ) : (
          <button
            onClick={() => onRequestVerification(match)}
            disabled={isLoading}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Request Verification
          </button>
        )}
      </div>
    </div>
  );
};
