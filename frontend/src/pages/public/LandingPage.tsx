import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { itemService } from '../../services/itemService';
import { LostItem, FoundItem } from '../../types';
import { ItemCard } from '../../components/items/ItemCard';
import {
  Compass,
  ShieldCheck,
  Search,
  PlusCircle,
  CheckCircle,
  Lock,
  HeartHandshake,
  QrCode,
  MapPin,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [recentLost, setRecentLost] = useState<LostItem[]>([]);
  const [recentFound, setRecentFound] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecent = async () => {
    try {
      const [lost, found] = await Promise.all([
        itemService.searchLost(),
        itemService.searchFound(),
      ]);
      setRecentLost(lost.slice(0, 3));
      setRecentFound(found.slice(0, 3));
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* LPU Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold mb-6 shadow-xs animate-in fade-in slide-in-from-top duration-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Lovely Professional University (LPU Phagwara) • Official Peer Lost & Found
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Find What’s Lost. <br />
            <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
              Return Directly to Peers.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The finder safely retains the item until it is returned directly to the verified owner.
            CampusFind coordinates deterministic matching, temporary chat, and cryptographically verified safe handovers.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/report-lost"
              className="w-full sm:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-600/25 transition flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              I Lost Something
            </Link>
            <Link
              to="/report-found"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              I Found Something
            </Link>
            <Link
              to="/search"
              className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl border border-slate-200 shadow-xs transition flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5 text-slate-400" />
              Search Public Board
            </Link>
          </div>

          {/* Highlight Cards */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Finder Retains Item</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                No bureaucratic storage desks. Items remain safely with the student finder until verified handover.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Zero PII Exposure</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Personal emails and phone numbers are never exposed. Verification happens via private distinguishing questions.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">One-Time Handover OTP</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Secure 6-digit cryptographic code and QR code with atomic double-confirmation at campus safe meeting points.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Workflow Visual Diagram */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-400 block mb-2">
              Step-by-Step Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-8">
              How CampusFind Works
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-xs">
              <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] font-bold text-sky-300 block mb-1">01. REPORT</span>
                <p className="font-semibold text-white">Owner / Finder Reports Item</p>
                <p className="text-[11px] text-slate-300 mt-1">Finder explicitly confirms: "I have this item".</p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] font-bold text-sky-300 block mb-1">02. MATCH</span>
                <p className="font-semibold text-white">Deterministic Engine</p>
                <p className="text-[11px] text-slate-300 mt-1">Multi-factor score labeled strictly as Possible Match.</p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] font-bold text-sky-300 block mb-1">03. VERIFY</span>
                <p className="font-semibold text-white">Private Challenge</p>
                <p className="text-[11px] text-slate-300 mt-1">Owner answers distinguishing feature prompt.</p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] font-bold text-sky-300 block mb-1">04. COORDINATE</span>
                <p className="font-semibold text-white">Temporary Chat</p>
                <p className="text-[11px] text-slate-300 mt-1">Agreed campus safe spot (e.g. Library Entrance).</p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] font-bold text-sky-300 block mb-1">05. HANDOVER</span>
                <p className="font-semibold text-white">One-Time OTP / QR</p>
                <p className="text-[11px] text-slate-300 mt-1">Single-use 6-digit code verified in person.</p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] font-bold text-emerald-400 block mb-1">06. CLOSED</span>
                <p className="font-semibold text-white">Double Confirmation</p>
                <p className="text-[11px] text-slate-300 mt-1">Both confirm return; trust badges awarded!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Feed Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Recent Found Items */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Recently Found Items (Retained by Finders)
              </h2>
              <p className="text-xs text-slate-500">Items found on campus waiting for verified owners</p>
            </div>
            <Link
              to="/search?tab=found"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              View All Found &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentFound.map((item) => (
              <ItemCard key={item.id} item={item} type="found" />
            ))}
          </div>
        </div>

        {/* Recent Lost Items */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-rose-600" />
                Recently Reported Lost Items
              </h2>
              <p className="text-xs text-slate-500">Have you seen any of these around campus?</p>
            </div>
            <Link
              to="/search?tab=lost"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              View All Lost &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentLost.map((item) => (
              <ItemCard key={item.id} item={item} type="lost" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
