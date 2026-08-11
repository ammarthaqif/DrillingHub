import React from 'react';
import { useDrilling } from '../context/DrillingContext';
import { ShieldAlert, User, LogOut, X, AlertTriangle, KeyRound } from 'lucide-react';

export const ConcurrentLoginPromptModal: React.FC = () => {
  const { 
    pendingLoginRequest, 
    acceptConcurrentLoginRequest, 
    declineConcurrentLoginRequest,
    currentUser 
  } = useDrilling();

  if (!pendingLoginRequest || pendingLoginRequest.status !== 'PENDING') {
    return null;
  }

  const reqUser = pendingLoginRequest.requestingUser;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#111115] border-2 border-amber-500/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative text-gray-200">
        
        {/* Glowing Top Alert Header */}
        <div className="bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-amber-500/25 p-6 border-b border-amber-500/40">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-amber-500 text-black font-extrabold shadow-lg shadow-amber-500/30 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Concurrent Login Request Detected
              </h2>
              <p className="text-xs text-amber-300 font-medium mt-0.5">
                Single Active Session Policy Enforced
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          
          <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-3">
            <p className="text-gray-300 leading-relaxed">
              Another user is requesting to log in to <strong>DRILLCORE OS</strong>. Only <strong>1 active user session</strong> is permitted at any time across the organization.
            </p>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Incoming Login Attempt
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-extrabold text-white text-sm">{reqUser.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {reqUser.role}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono pl-6">{reqUser.email}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-start space-x-2.5">
            <LogOut className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-rose-200">Automatic Logout Warning:</strong> If you click <span className="text-emerald-400 font-bold">Accept & Logout</span>, your current active session for <span className="underline">{currentUser?.name}</span> will be terminated immediately, and you will be signed out.
            </div>
          </div>

          {/* Action Choice Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => declineConcurrentLoginRequest(pendingLoginRequest.requestId)}
              className="py-3 px-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs transition flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4 text-rose-400" />
              <span>Decline Request</span>
            </button>

            <button
              type="button"
              onClick={() => acceptConcurrentLoginRequest(pendingLoginRequest.requestId)}
              className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Accept & Logout</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
