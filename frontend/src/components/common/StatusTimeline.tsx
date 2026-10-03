import React from 'react';
import { CaseStatus } from '../../types';
import { CheckCircle2, Circle, AlertTriangle, XCircle } from 'lucide-react';

interface StatusTimelineProps {
  status: CaseStatus;
}

interface Step {
  id: string;
  label: string;
  isComplete: (status: CaseStatus) => boolean;
  isCurrent: (status: CaseStatus) => boolean;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ status }) => {
  const steps: Step[] = [
    {
      id: 'REPORTED',
      label: 'Report Created',
      isComplete: () => true, // always completed if case exists
      isCurrent: (s) => s === 'LOST_REPORTED' || s === 'FOUND_REPORTED',
    },
    {
      id: 'MATCH',
      label: 'Possible Match Found',
      isComplete: (s) =>
        s !== 'LOST_REPORTED' && s !== 'FOUND_REPORTED',
      isCurrent: (s) => s === 'POSSIBLE_MATCH' || s === 'MATCH_REQUESTED',
    },
    {
      id: 'FINDER_CONFIRMED',
      label: 'Finder Confirmed Item',
      isComplete: (s) =>
        ![
          'LOST_REPORTED',
          'FOUND_REPORTED',
          'POSSIBLE_MATCH',
          'MATCH_REQUESTED',
        ].includes(s),
      isCurrent: (s) => s === 'FINDER_CONFIRMED',
    },
    {
      id: 'VERIFICATION',
      label: 'Ownership Verified',
      isComplete: (s) =>
        ![
          'LOST_REPORTED',
          'FOUND_REPORTED',
          'POSSIBLE_MATCH',
          'MATCH_REQUESTED',
          'FINDER_CONFIRMED',
          'VERIFICATION_PENDING',
        ].includes(s),
      isCurrent: (s) => s === 'VERIFICATION_PENDING' || s === 'VERIFIED',
    },
    {
      id: 'MEETING',
      label: 'Meeting Scheduled',
      isComplete: (s) =>
        ['HANDOVER_PENDING', 'RETURNED', 'CLOSED'].includes(s),
      isCurrent: (s) => s === 'MEETING_PROPOSED' || s === 'MEETING_CONFIRMED',
    },
    {
      id: 'HANDOVER',
      label: 'Handover OTP Verified',
      isComplete: (s) => ['RETURNED', 'CLOSED'].includes(s),
      isCurrent: (s) => s === 'HANDOVER_PENDING',
    },
    {
      id: 'RETURNED',
      label: 'Return Confirmed & Closed',
      isComplete: (s) => s === 'RETURNED' || s === 'CLOSED',
      isCurrent: (s) => s === 'RETURNED' || s === 'CLOSED',
    },
  ];

  const isDisputed = status === 'DISPUTED';
  const isCancelled = status === 'CANCELLED';

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-8">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Case Status Timeline</h3>
          <p className="text-xs text-slate-500">Live verification and handover stages</p>
        </div>
        <div>
          {isDisputed ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" /> Disputed / Under Review
            </span>
          ) : isCancelled ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full">
              <XCircle className="w-3.5 h-3.5" /> Cancelled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold rounded-full">
              Status: {status.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Responsive timeline flow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {steps.map((step, idx) => {
          const completed = step.isComplete(status);
          const current = step.isCurrent(status);

          return (
            <div
              key={step.id}
              className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                completed
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : current
                  ? 'bg-sky-50/90 border-sky-300 text-sky-900 ring-2 ring-sky-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Step {idx + 1}
                </span>
                {completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : current ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-ping" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300" />
                )}
              </div>
              <div className="text-xs font-semibold leading-snug">
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
