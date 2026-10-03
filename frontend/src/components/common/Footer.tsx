import React from 'react';
import { Compass, ShieldCheck, HeartHandshake, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 pt-12 pb-8 text-sm text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & core concept */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-slate-900">
                Campus<span className="text-sky-600">Find</span>
              </span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed max-w-sm">
              The direct peer Lost & Found platform. <strong>The finder keeps the item</strong> safely until it is handed directly to the verified owner at a campus-designated safe public spot.
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 pt-2">
              <span className="flex items-center gap-1 text-emerald-600">
                <ShieldCheck className="w-4 h-4" /> Finder-Retention
              </span>
              <span className="flex items-center gap-1 text-sky-600">
                <Lock className="w-4 h-4" /> Zero PII Exposure
              </span>
              <span className="flex items-center gap-1 text-indigo-600">
                <HeartHandshake className="w-4 h-4" /> OTP Handover
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/search" className="hover:text-sky-600 transition">Search Lost & Found</a></li>
              <li><a href="/map" className="hover:text-sky-600 transition">Campus Hotspot Map</a></li>
              <li><a href="/report-lost" className="hover:text-sky-600 transition">Report Lost Property</a></li>
              <li><a href="/report-found" className="hover:text-sky-600 transition">Report Found Property</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Campus Safety</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Always conduct item handovers at official campus meeting points (Library Entrance, Student Centre, Main Gate Security Desk).
            </p>
            <span className="inline-block px-2.5 py-1 bg-sky-50 text-sky-700 font-semibold text-[11px] rounded-md border border-sky-100">
              Verified Student Accounts Only
            </span>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© 2026 CampusFind Systems. Built for University Student Communities.</p>
          <p className="flex items-center gap-1">
            Deterministic Matching • One-Time Code Verification • Privacy Preserving
          </p>
        </div>
      </div>
    </footer>
  );
};
