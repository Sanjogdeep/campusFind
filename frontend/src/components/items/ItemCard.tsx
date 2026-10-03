import React from 'react';
import { Link } from 'react-router-dom';
import { LostItem, FoundItem } from '../../types';
import { MapPin, Calendar, Tag, ShieldCheck, HelpCircle } from 'lucide-react';

interface ItemCardProps {
  item: LostItem | FoundItem;
  type: 'lost' | 'found';
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, type }) => {
  const isFound = type === 'found';
  const itemDate = isFound ? (item as FoundItem).found_date : (item as LostItem).lost_date;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group">
      <div className="p-5">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
              isFound
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {isFound ? 'Found Item' : 'Lost Item'}
          </span>

          {item.category && (
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              {item.category.name}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-base text-slate-900 line-clamp-2 group-hover:text-sky-600 transition mb-2">
          {item.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {item.description}
        </p>

        {/* Finder Retention Badge */}
        {isFound && (item as FoundItem).has_item && (
          <div className="mb-4 px-2.5 py-1.5 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center gap-1.5 text-emerald-800 text-[11px] font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Finder confirms possession</span>
          </div>
        )}

        {/* Meta details */}
        <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
          {item.location && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{item.location.name}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>
              {new Date(itemDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {item.approx_time ? ` • ${item.approx_time}` : ''}
            </span>
          </div>

          {(item.brand || item.color) && (
            <div className="flex items-center gap-2 pt-1">
              {item.brand && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">
                  {item.brand}
                </span>
              )}
              {item.color && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">
                  {item.color}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Action */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500">
          Status: <span className="text-slate-800 uppercase">{item.status}</span>
        </span>
        <Link
          to={`/${type}/${item.id}`}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
        >
          View Details &rarr;
        </Link>
      </div>
    </div>
  );
};
