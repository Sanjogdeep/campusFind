import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caseService } from '../../services/caseService';
import { itemService } from '../../services/itemService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Case, Meeting, CampusLocation } from '../../types';
import { StatusTimeline } from '../../components/common/StatusTimeline';
import { CaseChat } from '../../components/chat/CaseChat';
import { HandoverModal } from '../../components/handover/HandoverModal';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  HelpCircle,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  MessageSquare,
  Lock,
} from 'lucide-react';

export const CaseDetailPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const id = Number(caseId);
  const { user } = useAuth();
  const { success, error, warning, info } = useToast();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [meetingLocations, setMeetingLocations] = useState<CampusLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Verification challenge state
  const [challengeQuestion, setChallengeQuestion] = useState('');
  const [ownerAnswer, setOwnerAnswer] = useState('');

  // Meeting scheduler state
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');

  // Handover modal state
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('NO_SHOW');
  const [disputeDesc, setDisputeDesc] = useState('');

  useEffect(() => {
    loadCase();
    loadLocations();
  }, [id]);

  const loadCase = async () => {
    try {
      const data = await caseService.getCaseDetail(id);
      setCaseData(data);
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to load case.');
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const locs = await itemService.getLocations();
      setMeetingLocations(locs);
      if (locs.length > 0) setSelectedLocationId(String(locs[0].id));
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-300" />
        Loading case coordination details...
      </div>
    );
  }

  if (!caseData || !user) return null;

  const isOwner = user.id === caseData.owner_id;
  const isFinder = user.id === caseData.finder_id;

  // Actions
  const handleFinderPossession = async (hasPossession: boolean) => {
    try {
      const updated = await caseService.confirmFinderPossession(id, hasPossession);
      setCaseData(updated);
      if (hasPossession) {
        success('Possession confirmed! Please now set the ownership verification question.');
      } else {
        info('Case declined and closed.');
      }
    } catch (err: any) {
      error(err.response?.data?.detail || 'Action failed.');
    }
  };

  const handleSetChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeQuestion.trim()) return;
    try {
      const updated = await caseService.setVerificationChallenge(id, challengeQuestion.trim());
      setCaseData(updated);
      success('Verification question submitted! Waiting for owner to answer.');
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to submit verification question.');
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerAnswer.trim()) return;
    try {
      const updated = await caseService.submitVerificationAnswer(id, ownerAnswer.trim());
      setCaseData(updated);
      success('Answer submitted! Waiting for finder to verify.');
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to submit answer.');
    }
  };

  const handleDecideVerification = async (isAccepted: boolean) => {
    try {
      const updated = await caseService.decideVerification(id, isAccepted);
      setCaseData(updated);
      if (isAccepted) {
        success('Ownership verified! Both parties can now schedule a campus handover meeting.');
      } else {
        warning('Verification marked as unconfirmed.');
      }
    } catch (err: any) {
      error(err.response?.data?.detail || 'Decision failed.');
    }
  };

  const handleProposeMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocationId || !meetingTime) {
      error('Please select a campus safe location and meeting time.');
      return;
    }
    try {
      await caseService.proposeMeeting(id, {
        location_id: Number(selectedLocationId),
        scheduled_time: new Date(meetingTime).toISOString(),
        notes: meetingNotes.trim() || undefined,
      });
      await loadCase();
      success('Meeting proposed! Waiting for other party to accept.');
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to propose meeting.');
    }
  };

  const handleRespondMeeting = async (action: 'ACCEPT' | 'REJECT' | 'CANCEL') => {
    try {
      await caseService.respondToMeeting(id, { action });
      await loadCase();
      if (action === 'ACCEPT') {
        success('Meeting confirmed! You can now verify handover with OTP/QR at the meeting.');
      } else {
        info('Meeting response recorded.');
      }
    } catch (err: any) {
      error(err.response?.data?.detail || 'Action failed.');
    }
  };

  const handleFileDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeDesc.trim()) return;
    try {
      await caseService.fileDispute({
        case_id: id,
        reason: disputeReason,
        description: disputeDesc.trim(),
      });
      setShowDisputeModal(false);
      await loadCase();
      warning('Dispute recorded. A campus administrator has been alerted.');
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to file dispute.');
    }
  };

  const isChatUnlocked = ![
    'LOST_REPORTED',
    'FOUND_REPORTED',
    'POSSIBLE_MATCH',
    'MATCH_REQUESTED',
  ].includes(caseData.status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest block mb-1">
            Peer Coordination • Case #{caseData.id}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Lost & Found Handover Coordination
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Direct peer handover between verified students with zero personal phone/email exposure.
          </p>
        </div>

        {/* Identity Badges Requirement 11 */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Owner:</span>
            <span className="font-bold text-slate-800">{caseData.owner?.name}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] text-emerald-700 font-bold">Verified Account</span>
          </div>

          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Finder:</span>
            <span className="font-bold text-slate-800">{caseData.finder?.name}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] text-emerald-700 font-bold">Verified Account</span>
          </div>
        </div>
      </div>

      {/* Case Status Timeline */}
      <StatusTimeline status={caseData.status} />

      {/* Main Grid: Left Coordination Actions, Right Temporary Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Workflow Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: MATCH REQUEST & FINDER POSSESSION CONFIRMATION */}
          {caseData.status === 'MATCH_REQUESTED' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
                <HelpCircle className="w-5 h-5" />
                <span>Step 1: Confirm Possession</span>
              </div>

              {isFinder ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    A student believes the item you found belongs to them:
                    <br />
                    <strong className="text-slate-900 text-sm">"{caseData.lost_item?.title}"</strong>
                    <br />
                    Do you have this item in your possession?
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleFinderPossession(true)}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Yes, I Have This Item
                    </button>
                    <button
                      onClick={() => handleFinderPossession(false)}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Not My Found Item
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 text-xs text-sky-900">
                  Your verification request has been delivered to the finder. Waiting for them to confirm they have the item.
                </div>
              )}
            </div>
          )}

          {/* STEP 2: OWNERSHIP VERIFICATION CHALLENGE */}
          {['FINDER_CONFIRMED', 'VERIFICATION_PENDING'].includes(caseData.status) && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
                <Lock className="w-5 h-5" />
                <span>Step 2: Private Ownership Verification</span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                To prevent false claims, the finder asks a private distinguishing question (e.g. sticker on cover, engraving, unique marks) that only the genuine owner would know.
              </p>

              {/* If finder needs to ask question */}
              {caseData.status === 'FINDER_CONFIRMED' && isFinder && (
                <form onSubmit={handleSetChallenge} className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Ask the Owner a Private Verification Question
                  </label>
                  <input
                    type="text"
                    required
                    value={challengeQuestion}
                    onChange={(e) => setChallengeQuestion(e.target.value)}
                    placeholder="e.g. Describe any sticker on the case or scratch on the left side"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-sky-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    Submit Verification Challenge
                  </button>
                </form>
              )}

              {caseData.status === 'FINDER_CONFIRMED' && isOwner && (
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                  The finder is preparing a private verification question to confirm item ownership.
                </div>
              )}

              {/* If question is set, owner answers */}
              {caseData.status === 'VERIFICATION_PENDING' && (
                <div className="space-y-4">
                  <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block mb-1">
                      Finder's Challenge Question:
                    </span>
                    <p className="font-semibold text-xs text-slate-900">
                      "{caseData.verification_question}"
                    </p>
                  </div>

                  {isOwner && !caseData.verification_answer && (
                    <form onSubmit={handleSubmitAnswer} className="space-y-3">
                      <label className="block text-xs font-bold text-slate-700">
                        Your Private Identifying Answer
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={ownerAnswer}
                        onChange={(e) => setOwnerAnswer(e.target.value)}
                        placeholder="Provide the distinguishing characteristic accurately..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-sky-500 outline-none"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                      >
                        Submit Answer
                      </button>
                    </form>
                  )}

                  {caseData.verification_answer && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Owner's Answer:
                      </span>
                      <p className="text-xs font-medium text-slate-800">
                        "{caseData.verification_answer}"
                      </p>

                      {isFinder && (
                        <div className="pt-2 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleDecideVerification(true)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Correct Answer (Confirm Verified)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecideVerification(false)}
                            className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            Does Not Match
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: CAMPUS SAFE MEETING SCHEDULER */}
          {[
            'VERIFIED',
            'MEETING_PROPOSED',
            'MEETING_CONFIRMED',
            'HANDOVER_PENDING',
          ].includes(caseData.status) && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
                  <MapPin className="w-5 h-5" />
                  <span>Step 3: Campus Safe Meeting Handover</span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Ownership Verified
                </span>
              </div>

              {caseData.status === 'VERIFIED' && (
                <form onSubmit={handleProposeMeeting} className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Select an official campus safe meeting location and time. Both parties must accept the agreed time and spot.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Campus Public Meeting Spot *
                      </label>
                      <select
                        required
                        value={selectedLocationId}
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-sky-500 outline-none"
                      >
                        {meetingLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Proposed Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-sky-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                    <input
                      type="text"
                      value={meetingNotes}
                      onChange={(e) => setMeetingNotes(e.target.value)}
                      placeholder="e.g. Near the main turnstiles by the information desk"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-sky-500 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-4 h-4" />
                    Propose Handover Meeting
                  </button>
                </form>
              )}

              {caseData.status === 'MEETING_PROPOSED' && (
                <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-950">
                      Handover Meeting Proposed
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-sky-200 text-sky-800 rounded">
                      Pending Acceptance
                    </span>
                  </div>

                  <p className="text-xs text-sky-800 leading-relaxed">
                    A campus meeting was proposed for this case. Both parties must confirm before the one-time handover OTP is unlocked.
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleRespondMeeting('ACCEPT')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Accept Proposed Meeting
                    </button>
                    <button
                      onClick={() => handleRespondMeeting('CANCEL')}
                      className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
                    >
                      Cancel / Reschedule
                    </button>
                  </div>
                </div>
              )}

              {/* Handover Ready Box */}
              {['MEETING_CONFIRMED', 'HANDOVER_PENDING'].includes(caseData.status) && (
                <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-emerald-700" />
                      <span className="text-sm font-extrabold text-emerald-950">
                        Meeting Confirmed • Handover Ready
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-full">
                      Ready for Handover
                    </span>
                  </div>

                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Meet at the agreed public location. To verify the transfer and securely close the case, open the Handover Verification modal to reveal or input the single-use 6-digit OTP / QR code.
                  </p>

                  <button
                    onClick={() => setShowHandoverModal(true)}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    Open Handover Verification (OTP / QR Code)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CASE CLOSED SUCCESS STATE */}
          {['RETURNED', 'CLOSED'].includes(caseData.status) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-emerald-950">
                Item Returned • Case Successfully Closed
              </h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                Both the finder and owner verified the handover code. The item has been returned directly to its owner.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-xs"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Temporary Private Chat (5 cols) */}
        <div className="lg:col-span-5">
          {isChatUnlocked ? (
            <CaseChat
              caseId={id}
              currentUser={user}
              onDisputeTrigger={() => setShowDisputeModal(true)}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs h-[420px] flex flex-col items-center justify-center">
              <Lock className="w-8 h-8 text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">Chat Unlocks After Possession</p>
              <p className="max-w-xs mt-1 text-slate-500">
                Temporary private chat is activated once the finder confirms they hold the item.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Handover OTP Modal */}
      {showHandoverModal && (
        <HandoverModal
          caseId={id}
          isOpen={showHandoverModal}
          onClose={() => setShowHandoverModal(false)}
          currentUser={user}
          isFinder={isFinder}
          onHandoverComplete={loadCase}
        />
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Report Problem or Dispute
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Escalate to campus administrators for review.
            </p>

            <form onSubmit={handleFileDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Dispute
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500"
                >
                  <option value="NO_SHOW">Other party did not appear at meeting</option>
                  <option value="WRONG_ITEM">Item did not match description</option>
                  <option value="DAMAGED">Item was damaged</option>
                  <option value="FALSE_CLAIM">Suspicious or fraudulent claim</option>
                  <option value="HARASSMENT">Harassment or inappropriate behavior</option>
                  <option value="OTHER">Other campus issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description of Issue *
                </label>
                <textarea
                  required
                  rows={3}
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Provide context for campus administration review..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  File Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
