import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { itemService } from '../../services/itemService';
import { caseService } from '../../services/caseService';
import { LostItem, FoundItem, Case } from '../../types';
import { ItemCard } from '../../components/items/ItemCard';
import {
  Compass,
  PlusCircle,
  CheckCircle,
  Sparkles,
  Calendar,
  ShieldCheck,
  Award,
  ArrowRight,
  Clock,
  ChevronRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [myLost, setMyLost] = useState<LostItem[]>([]);
  const [myFound, setMyFound] = useState<FoundItem[]>([]);
  const [myCases, setMyCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [lost, found, cases] = await Promise.all([
        itemService.getMyLost(),
        itemService.getMyFound(),
        caseService.getMyCases(),
      ]);
      setMyLost(lost);
      setMyFound(found);
      setMyCases(cases);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const activeCases = myCases.filter(
    (c) => !['RETURNED', 'CLOSED', 'CANCELLED'].includes(c.status)
  );
  const completedReturns = myCases.filter((c) =>
    ['RETURNED', 'CLOSED'].includes(c.status)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Banner & Trust Recognition */}
      <div className="bg-gradient-to-r from-sky-900 via-blue-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-xs text-sky-200">
              Verified Student Account
            </span>
            <span className="text-xs text-slate-300">• {user?.department || 'University Student'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            You have {activeCases.length} active lost & found coordination case{activeCases.length === 1 ? '' : 's'}. Remember to verify items before meeting.
          </p>
        </div>

        {/* Trust Badges Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center flex-shrink-0">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
              Campus Trust Rating
            </span>
            <div className="text-sm font-bold text-white mt-0.5">
              {user?.items_returned_count || 0} Successful Return{(user?.items_returned_count || 0) === 1 ? '' : 's'}
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {user?.badges?.map((badge, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-amber-300/20 text-amber-200 text-[10px] font-semibold rounded-md border border-amber-300/30"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/report-lost"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-md transition flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Lost Something?</span>
            <h4 className="font-extrabold text-base text-slate-900 group-hover:text-rose-600 transition mt-0.5">
              Create Lost Report
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <PlusCircle className="w-5 h-5" />
          </div>
        </Link>

        <Link
          to="/report-found"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Found An Item?</span>
            <h4 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-600 transition mt-0.5">
              Create Found Report
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </Link>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reports Active</span>
            <h4 className="font-extrabold text-xl text-slate-900 mt-0.5">
              {myLost.length + myFound.length} Reports
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Handover Complete</span>
            <h4 className="font-extrabold text-xl text-emerald-600 mt-0.5">
              {completedReturns.length} Returned
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Cases / Handover Progress Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600" />
            Active Verification & Handover Cases ({activeCases.length})
          </h2>
        </div>

        {activeCases.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
            No active handover cases in progress. When you request verification on a possible match, your case will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCases.map((c) => {
              const isOwner = c.owner_id === user?.id;
              const roleTitle = isOwner ? 'Lost Item Owner' : 'Finder (You have this item)';
              return (
                <Link
                  key={c.id}
                  to={`/cases/${c.id}`}
                  className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        Case #{c.id} • {roleTitle}
                      </span>
                      <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition">
                      {c.lost_item?.title || c.found_item?.title || 'Matching Items'}
                    </h4>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {c.lost_item?.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-600">
                    <span>Manage Coordination & Handover</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* My Reports Tabs & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Lost Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">
              My Lost Item Reports ({myLost.length})
            </h3>
            <Link to="/report-lost" className="text-xs font-bold text-sky-600 hover:text-sky-700">
              + Report Lost
            </Link>
          </div>

          <div className="space-y-3">
            {myLost.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                You haven’t reported any lost items.
              </div>
            ) : (
              myLost.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-4"
                >
                  <div className="truncate">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{item.title}</h4>
                    <span className="text-[11px] text-slate-500 block">
                      Lost on {new Date(item.lost_date).toLocaleDateString()} • {item.location?.name}
                    </span>
                  </div>
                  <Link
                    to={`/lost/${item.id}`}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-sky-50 text-sky-600 rounded-lg text-xs font-bold transition flex-shrink-0"
                  >
                    View Matches
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Found Items (Retained by user) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">
              My Found Reports ({myFound.length})
            </h3>
            <Link to="/report-found" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              + Report Found
            </Link>
          </div>

          <div className="space-y-3">
            {myFound.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                You haven’t reported finding any items.
              </div>
            ) : (
              myFound.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-4"
                >
                  <div className="truncate">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{item.title}</h4>
                    <span className="text-[11px] text-emerald-700 font-semibold block">
                      Retained safely by you • {item.location?.name}
                    </span>
                  </div>
                  <Link
                    to={`/found/${item.id}`}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold transition flex-shrink-0"
                  >
                    View Details
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
