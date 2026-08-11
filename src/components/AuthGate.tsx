import React, { useState, useEffect } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { UserRole, LocationType } from '../types/drilling';
import { 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  Building2, 
  Mail, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Globe, 
  UserPlus, 
  HardHat,
  ChevronRight,
  Shield,
  Loader2
} from 'lucide-react';

export const AuthGate: React.FC = () => {
  const { 
    allUsers, 
    loginUser, 
    registerUser, 
    verifyEmailWithToken,
    systemConfig,
    availableRoles,
    availableDepartments,
    availableLocations,
    logoutNotice
  } = useDrilling();

  const [activeTab, setActiveTab] = useState<'signin' | 'request'>('signin');
  const [selectedUserId, setSelectedUserId] = useState<string>(allUsers[0]?.id || '');
  const [pinCode, setPinCode] = useState<string>('1234');
  
  // Notice & Errors
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pending Concurrent Login Request state
  const [pendingRequestInfo, setPendingRequestInfo] = useState<{
    requestId: string;
    requestingUserId: string;
    activeUser?: { name: string; role: string };
  } | null>(null);

  // Verification Token Quick Input
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenValue, setTokenValue] = useState('');

  // Request Access Form
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqRole, setReqRole] = useState<UserRole>('Drilling Engineer');
  const [reqDept, setReqDept] = useState('Drilling Operations');
  const [reqLocation, setReqLocation] = useState<LocationType>('Main Supply Base Yard');

  // Listen for login request acceptance/decline status updates while in pending state
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (pendingRequestInfo) {
      const checkStatus = () => {
        try {
          const rawReq = localStorage.getItem('drillcore_concurrent_login_request');
          if (rawReq) {
            const parsed = JSON.parse(rawReq);
            if (parsed && parsed.requestId === pendingRequestInfo.requestId) {
              if (parsed.status === 'ACCEPTED') {
                // Request approved! Override active session and complete login
                const res = loginUser(pendingRequestInfo.requestingUserId, pinCode, { overrideActiveSession: true });
                if (res.success) {
                  localStorage.removeItem('drillcore_concurrent_login_request');
                  setPendingRequestInfo(null);
                } else {
                  setErrorMsg(res.message);
                  setPendingRequestInfo(null);
                }
              } else if (parsed.status === 'DECLINED') {
                setErrorMsg(
                  `Login request was DECLINED by active user session (${pendingRequestInfo.activeUser?.name || 'Active User'}). Access denied.`
                );
                localStorage.removeItem('drillcore_concurrent_login_request');
                setPendingRequestInfo(null);
              }
            }
          }
        } catch (err) {
          console.error('Polling check error:', err);
        }
      };

      interval = setInterval(checkStatus, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pendingRequestInfo, pinCode, loginUser]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedUserId) {
      setErrorMsg('Please select a verified corporate account.');
      return;
    }

    const res = loginUser(selectedUserId, pinCode);

    if (res.pendingRequest && res.requestId) {
      setPendingRequestInfo({
        requestId: res.requestId,
        requestingUserId: selectedUserId,
        activeUser: res.activeUser,
      });
      return;
    }

    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  const handleCancelRequest = () => {
    try {
      localStorage.removeItem('drillcore_concurrent_login_request');
    } catch {}
    setPendingRequestInfo(null);
    setErrorMsg('Login request cancelled.');
  };

  const handleRequestAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!reqName.trim() || !reqEmail.trim()) {
      setErrorMsg('Please provide both your name and corporate email address.');
      return;
    }

    const res = registerUser({
      name: reqName.trim(),
      email: reqEmail.trim(),
      role: reqRole,
      department: reqDept,
      location: reqLocation,
    });

    if (res.success) {
      setSuccessMsg(res.message);
      setReqName('');
      setReqEmail('');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!tokenValue.trim()) {
      setErrorMsg('Please enter a verification token.');
      return;
    }

    const ok = verifyEmailWithToken(tokenValue.trim());
    if (ok) {
      setSuccessMsg('Corporate email successfully verified! Your account is active.');
      setShowTokenInput(false);
      setTokenValue('');
    } else {
      setErrorMsg('Invalid or expired verification token.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      
      {/* Background Decorative Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Restricted Access Card */}
      <div className="w-full max-w-2xl bg-[#0e0e12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10 my-auto">
        
        {/* Top Security Header */}
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-b border-amber-500/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-black font-extrabold text-2xl shadow-lg shadow-amber-500/30">
                D
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                    DRILL<span className="text-amber-500">CORE</span> <span className="text-xs font-light text-gray-400">OS</span>
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    v2026.1
                  </span>
                </div>
                <p className="text-xs text-gray-400">Campaign Tubular & Equipment Inventory Engine</p>
              </div>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold self-start sm:self-auto">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Restricted Access Only</span>
            </div>
          </div>

          {/* Confidentiality Notice Banner */}
          <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/5 flex items-start space-x-2.5 text-xs text-gray-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>CONFIDENTIAL OPERATIONAL SYSTEM:</strong> Access is restricted to authorized drilling engineers, logistics coordinators, and rig toolpushers. Public access is strictly prohibited.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/40">
          <button
            onClick={() => { setActiveTab('signin'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-3.5 px-4 text-xs font-bold transition flex items-center justify-center space-x-2 border-b-2 ${
              activeTab === 'signin'
                ? 'border-amber-500 text-amber-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Authorized Personnel Sign-In</span>
          </button>

          <button
            onClick={() => { setActiveTab('request'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-3.5 px-4 text-xs font-bold transition flex items-center justify-center space-x-2 border-b-2 ${
              activeTab === 'request'
                ? 'border-amber-500 text-amber-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Request Corporate Access</span>
          </button>
        </div>

        {/* Logout Notice Banner */}
        {logoutNotice && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-3">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <strong className="font-bold">Session Terminated:</strong> {logoutNotice}
            </div>
          </div>
        )}

        {/* Alerts / Error Messages */}
        {errorMsg && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold">Access Blocked:</strong> {errorMsg}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold">Request Updated:</strong> {successMsg}
            </div>
          </div>
        )}

        {/* PENDING APPROVAL VIEW FOR CONCURRENT LOGIN */}
        {pendingRequestInfo ? (
          <div className="p-8 sm:p-10 space-y-6 text-center">
            <div className="relative inline-block my-2">
              <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-8 h-8 text-amber-500 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2.5 max-w-md mx-auto">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Single Active Session Control
              </span>
              <h3 className="text-lg font-extrabold text-white tracking-tight">
                Awaiting Active User Approval
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                An active session is currently logged in under <strong className="text-amber-400 font-bold">{pendingRequestInfo.activeUser?.name || 'Active User'}</strong> ({pendingRequestInfo.activeUser?.role || 'Staff'}).
              </p>
              <div className="p-4 bg-black/60 border border-white/10 rounded-2xl text-[11px] text-gray-400 space-y-1 text-left">
                <p className="font-semibold text-amber-300 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Permission Request Transmitted</span>
                </p>
                <p>A high-priority prompt has been displayed on the active user's screen.</p>
                <p>If accepted, the active user will be logged out and your session will commence automatically.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleCancelRequest}
                className="px-6 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition shadow-sm"
              >
                Cancel Login Request
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* TAB 1: Sign-In Form */}
        {activeTab === 'signin' && (
          <div className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSignIn} className="space-y-5">
              
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Select Corporate Identity
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {allUsers.map((u) => {
                    const isSelected = selectedUserId === u.id;
                    const isApproved = u.status === 'Active Approved' || !u.status;

                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                            : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-amber-500 text-black' : 'bg-white/10 text-gray-300'
                          }`}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-xs text-white">{u.name}</span>
                              <span className="text-[10px] text-amber-400 font-mono px-1.5 py-0.2 bg-amber-500/10 rounded">
                                {u.role}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 flex items-center space-x-2 mt-0.5">
                              <span>{u.email}</span>
                              <span>•</span>
                              <span>{u.department}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {isApproved ? (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Approved
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              {u.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Security Key / Access Code
                  </label>
                  <span className="text-[10px] text-gray-500 font-mono">Default: 1234</span>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="Enter 4-digit security code..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authorize & Enter Workspace</span>
              </button>
            </form>

            {/* Quick Email Token Verification Expandable */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => setShowTokenInput(!showTokenInput)}
                className="text-xs text-amber-400 hover:underline font-semibold flex items-center space-x-1"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Have a corporate email verification token? Click here</span>
              </button>

              {showTokenInput && (
                <form onSubmit={handleVerifyToken} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={tokenValue}
                    onChange={(e) => setTokenValue(e.target.value)}
                    placeholder="e.g. VERIFY-TOK-883920"
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl hover:bg-amber-400 transition"
                  >
                    Verify Token
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Request Corporate Access Form */}
        {activeTab === 'request' && (
          <div className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleRequestAccess} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  placeholder="e.g. Capt. Marcus Vance"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Corporate Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={reqEmail}
                  onChange={(e) => setReqEmail(e.target.value)}
                  placeholder="e.g. marcus.vance@petronas.com"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Must end with an approved domain ({systemConfig.corporateDomains.map(d => `@${d}`).join(', ')}).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Operational Role
                  </label>
                  <select
                    value={reqRole}
                    onChange={(e) => setReqRole(e.target.value as UserRole)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {availableRoles.map(roleOpt => (
                      <option key={roleOpt} value={roleOpt} className="bg-[#141417] text-white">
                        {roleOpt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Department
                  </label>
                  <select
                    value={reqDept}
                    onChange={(e) => setReqDept(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {availableDepartments.map(deptOpt => (
                      <option key={deptOpt} value={deptOpt} className="bg-[#141417] text-white">
                        {deptOpt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Primary Location / Yard
                </label>
                <select
                  value={reqLocation}
                  onChange={(e) => setReqLocation(e.target.value as LocationType)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {availableLocations.map(locOpt => (
                    <option key={locOpt} value={locOpt} className="bg-[#141417] text-white">
                      {locOpt}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Submit Access Request</span>
              </button>
            </form>
          </div>
        )}
        </>
        )}

        {/* Footer Security Notice */}
        <div className="bg-black/80 border-t border-white/10 p-4 text-center text-[11px] text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 text-gray-400">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>ISO 27001 Certified Security Protocol</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-500 font-mono text-[10px]">
            <span>Encrypted Firestore Sync</span>
            <span>•</span>
            <span>Domain Whitelisting Enabled</span>
          </div>
        </div>

      </div>
    </div>
  );
};
