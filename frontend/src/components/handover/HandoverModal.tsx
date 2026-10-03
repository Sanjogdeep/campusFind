import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { HandoverToken, User } from '../../types';
import { caseService } from '../../services/caseService';
import { useToast } from '../../contexts/ToastContext';
import { KeyRound, QrCode, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

interface HandoverModalProps {
  caseId: number;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  isFinder: boolean;
  onHandoverComplete: () => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({
  caseId,
  isOpen,
  onClose,
  currentUser,
  isFinder,
  onHandoverComplete,
}) => {
  const [token, setToken] = useState<HandoverToken | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { success, error, info } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadToken();
    }
  }, [isOpen, caseId]);

  const loadToken = async () => {
    setLoading(true);
    try {
      const data = await caseService.getHandoverToken(caseId);
      setToken(data);
    } catch (err: any) {
      error(err.response?.data?.detail || 'Could not retrieve handover token.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode || inputCode.length !== 6) {
      error('Please enter the valid 6-digit handover code.');
      return;
    }

    setVerifying(true);
    const roleConfirmation = isFinder ? 'HANDED_OVER' : 'RECEIVED';

    try {
      const res = await caseService.confirmHandover(caseId, inputCode.trim(), roleConfirmation);
      if (res.is_complete) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
        success(res.message);
        onHandoverComplete();
        onClose();
      } else {
        info(res.message);
        await loadToken();
      }
    } catch (err: any) {
      error(err.response?.data?.detail || 'Handover confirmation failed.');
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-900">
            Campus Meeting Handover
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Both parties must verify the 6-digit one-time code to safely close the case.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Generating cryptographic one-time token...
          </div>
        ) : token ? (
          <div>
            {/* OTP Code Display Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center mb-6">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Handover Verification Code
              </span>
              <div className="text-3xl font-extrabold font-mono tracking-widest text-sky-700 my-2">
                {token.token_code}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Expires in 30 minutes • One-time single use
              </span>

              {/* QR Code toggle */}
              <button
                type="button"
                onClick={() => setShowQR(!showQR)}
                className="mt-3 text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5" />
                {showQR ? 'Hide QR Code' : 'Display One-Time QR Code'}
              </button>

              {showQR && (
                <div className="mt-4 p-4 bg-white rounded-xl inline-block shadow-xs border border-slate-200">
                  <QRCodeSVG value={token.qr_payload} size={160} />
                </div>
              )}
            </div>

            {/* Confirmation status indicators */}
            <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 ${
                  token.finder_confirmed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 ${
                    token.finder_confirmed ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                />
                <span>Finder Confirmed</span>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center gap-2 ${
                  token.owner_confirmed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 ${
                    token.owner_confirmed ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                />
                <span>Owner Confirmed</span>
              </div>
            </div>

            {/* Input code verification form */}
            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter 6-Digit Handover Code to Confirm
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 739421"
                  className="w-full text-center tracking-widest font-mono text-xl py-3 px-4 rounded-xl border border-slate-300 focus:border-sky-500 outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={verifying || inputCode.length !== 6}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                {isFinder ? 'Confirm: "I Handed Over the Item"' : 'Confirm: "I Received the Item"'}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-rose-500">
            Failed to load verification token.
          </div>
        )}
      </div>
    </div>
  );
};
