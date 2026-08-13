import React, { useState, useEffect } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { safeJsonParse } from '../utils/safeJson';
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
  Loader2,
  Send,
  Sparkles,
  Smartphone,
  QrCode,
  KeyRound,
  RefreshCw,
  HelpCircle,
  Check
} from 'lucide-react';

export const AuthGate: React.FC = () => {
  const { 
    allUsers, 
    loginUser, 
    registerUser, 
    verifyEmailWithToken,
    sendEmailCredentialsServer,
    sendAuthTokenEmail,
    resetPasswordWithToken,
    provisionSystemAdminAccount,
    toggleMsAuthenticator,
    systemConfig,
    availableRoles,
    availableDepartments,
    availableLocations,
    logoutNotice
  } = useDrilling();

  const [activeTab, setActiveTab] = useState<'signin' | 'reset-password' | 'request' | 'ms-authenticator'>('signin');
  
  // Confidential Sign-In State (No hardcoded email)
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [totpCode, setTotpCode] = useState<string>('');
  const [requiresTotpInput, setRequiresTotpInput] = useState<boolean>(false);
  const [useMsAuthCheck, setUseMsAuthCheck] = useState<boolean>(false);
  const [isDispatchingEmail, setIsDispatchingEmail] = useState(false);

  // Password Setup / Reset State
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSendingToken, setIsSendingToken] = useState(false);
  const [tokenSent, setTokenSent] = useState(false);

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
            const parsed = safeJsonParse(rawReq, null);
            if (parsed && parsed.requestId === pendingRequestInfo.requestId) {
              if (parsed.status === 'ACCEPTED') {
                const res = loginUser(pendingRequestInfo.requestingUserId, password, { overrideActiveSession: true, totpCode });
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
  }, [pendingRequestInfo, password, totpCode, loginUser]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailTrim = loginEmail.trim().toLowerCase();
    if (!emailTrim) {
      setErrorMsg('Please enter your approved corporate email address.');
      return;
    }

    // Auto-provision master admin if signing in with ammarthaqif.ar@gmail.com
    if (emailTrim === 'ammarthaqif.ar@gmail.com') {
      provisionSystemAdminAccount();
    }

    const res = loginUser(emailTrim, password, { totpCode });

    if (res.requiresTotp) {
      setRequiresTotpInput(true);
      setErrorMsg(res.message);
      return;
    }

    if (res.pendingRequest && res.requestId) {
      setPendingRequestInfo({
        requestId: res.requestId,
        requestingUserId: emailTrim,
        activeUser: res.activeUser,
      });
      return;
    }

    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  const handleSendAuthorizationToken = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailTrim = resetEmail.trim().toLowerCase();
    if (!emailTrim || !emailTrim.includes('@')) {
      setErrorMsg('Please enter a valid approved corporate email address.');
      return;
    }

    setIsSendingToken(true);
    const res = await sendAuthTokenEmail(emailTrim);
    setIsSendingToken(false);

    if (res.success) {
      setTokenSent(true);
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!resetEmail.trim() || !resetToken.trim() || !newPassword) {
      setErrorMsg('Please complete all required password setup fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match. Please re-enter your password.');
      return;
    }

    const res = resetPasswordWithToken(resetEmail.trim(), resetToken.trim(), newPassword);
    if (res.success) {
      setSuccessMsg(res.message);
      setLoginEmail(resetEmail.trim());
      setPassword(newPassword);
      setTimeout(() => {
        setActiveTab('signin');
      }, 1500);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleDispatchCredentialsToEmail = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailTrim = loginEmail.trim().toLowerCase();
    if (!emailTrim || !emailTrim.includes('@')) {
      setErrorMsg('Please enter a valid corporate email address in the field above.');
      return;
    }

    setIsDispatchingEmail(true);
    const res = await sendEmailCredentialsServer(emailTrim);
    setIsDispatchingEmail(false);

    if (res.success) {
      setSuccessMsg(res.message);
    } else {
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

  const handleRequestAccess = async (e: React.FormEvent) => {
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

      {/* Main Restricted Confidential Gateway Card */}
      <div className="w-full max-w-xl bg-[#0e0e12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10 my-auto">
        
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
                    Confidential Gateway
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
          <div className="mt-4 p-3 rounded-xl bg-black/50 border border-white/5 flex items-start space-x-2.5 text-xs text-gray-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>HIGHLY CONFIDENTIAL SYSTEM:</strong> System Administrator access is strictly reserved for <code className="text-amber-300 font-mono">ammarthaqif.ar@gmail.com</code>. Authorization tokens & password setup keys are sent to approved corporate email addresses.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/40 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('signin'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3.5 px-4 text-xs font-bold transition flex items-center justify-center space-x-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'signin'
                ? 'border-amber-500 text-amber-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Corporate Sign-In</span>
          </button>

          <button
            onClick={() => { setActiveTab('reset-password'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3.5 px-4 text-xs font-bold transition flex items-center justify-center space-x-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'reset-password'
                ? 'border-amber-500 text-amber-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Authorization Token & Password</span>
          </button>

          <button
            onClick={() => { setActiveTab('ms-authenticator'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3.5 px-4 text-xs font-bold transition flex items-center justify-center space-x-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'ms-authenticator'
                ? 'border-amber-500 text-amber-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>MS Authenticator</span>
          </button>

          <button
            onClick={() => { setActiveTab('request'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3.5 px-4 text-xs font-bold transition flex items-center justify-center space-x-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'request'
                ? 'border-amber-500 text-amber-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Request Access</span>
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
              <strong className="font-bold">Access Alert:</strong> {errorMsg}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold">System Notice:</strong> {successMsg}
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
            {/* TAB 1: Secretive Corporate Email Sign-In */}
            {activeTab === 'signin' && (
              <div className="p-6 sm:p-8 space-y-5">

                <form onSubmit={handleSignIn} className="space-y-4">
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                      Corporate Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="e.g. ammarthaqif.ar@gmail.com or engineer@petronas.com"
                        className="w-full bg-black/70 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        Login Password / Security Key
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(loginEmail);
                          setActiveTab('reset-password');
                        }}
                        className="text-[10px] text-amber-400 hover:underline font-mono"
                      >
                        Forgot / First Time Login?
                      </button>
                    </div>
                    <div className="relative">
                      <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password or default key (1234)..."
                        className="w-full bg-black/70 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Microsoft Authenticator TOTP Field (Triggered if 2FA required or manually toggled) */}
                  {(requiresTotpInput || useMsAuthCheck) && (
                    <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
                      <div className="flex items-center space-x-2 text-cyan-300 text-xs font-bold">
                        <Smartphone className="w-4 h-4 text-cyan-400" />
                        <span>Microsoft Authenticator 2FA Required</span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit code (e.g. 123456)..."
                        className="w-full bg-black/80 border border-cyan-500/40 rounded-xl px-3 py-2 text-center text-sm tracking-[0.3em] font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                      <p className="text-[10px] text-gray-400">Open your Microsoft Authenticator mobile app to get the current 6-digit passcode.</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-2 text-xs text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useMsAuthCheck}
                        onChange={(e) => setUseMsAuthCheck(e.target.checked)}
                        className="rounded bg-black border-white/20 text-amber-500 focus:ring-amber-500"
                      />
                      <span>Enforce Microsoft Authenticator 2FA</span>
                    </label>
                  </div>

                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="submit"
                      className="py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authenticate & Enter</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDispatchCredentialsToEmail}
                      disabled={isDispatchingEmail}
                      className="py-3 px-4 bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2"
                      title="Dispatch credentials via Email Server Gateway API"
                    >
                      {isDispatchingEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      ) : (
                        <Send className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>Email Authorization Token</span>
                    </button>
                  </div>
                </form>

                {/* Quick Token Verification Accordion */}
                <div className="pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowTokenInput(!showTokenInput)}
                    className="text-xs text-amber-400 hover:underline font-semibold flex items-center space-x-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Have a verification token? Verify corporate email token</span>
                  </button>

                  {showTokenInput && (
                    <form onSubmit={handleVerifyToken} className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={tokenValue}
                        onChange={(e) => setTokenValue(e.target.value)}
                        placeholder="e.g. 883920"
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

            {/* TAB 2: Set / Reset Password via Authorization Token */}
            {activeTab === 'reset-password' && (
              <div className="p-6 sm:p-8 space-y-5">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                  <strong className="font-bold flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5" /> Authorization Token Verification Flow
                  </strong>
                  <p className="text-gray-300 leading-relaxed">
                    First-time administrator or user password setup: Request an authorization token sent to your approved corporate email, then set your custom login password.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Approved Corporate Email
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="e.g. ammarthaqif.ar@gmail.com or user@petronas.com"
                        className="flex-1 bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleSendAuthorizationToken}
                        disabled={isSendingToken}
                        className="px-4 py-2.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black font-bold text-xs rounded-xl transition flex items-center space-x-1.5 whitespace-nowrap"
                      >
                        {isSendingToken ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Send Token</span>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-3.5 pt-2 border-t border-white/10">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Authorization Verification Token
                      </label>
                      <input
                        type="text"
                        required
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Enter 6-digit token received in email (e.g. 849201)..."
                        className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 4 characters..."
                          className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password..."
                          className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 mt-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Update Password & Return To Login</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 3: Microsoft Authenticator Info & Setup */}
            {activeTab === 'ms-authenticator' && (
              <div className="p-6 sm:p-8 space-y-5">
                <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Microsoft Authenticator Integration</h4>
                      <p className="text-[11px] text-cyan-300">Time-Based One-Time Password (TOTP) Security</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    Protect your confidential drilling inventory account with 2FA using Microsoft Authenticator on your mobile device.
                  </p>

                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-gray-300 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[10px] uppercase">Account Issuer:</span>
                      <span className="text-amber-400 font-bold">DrillCore OS</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[10px] uppercase">Secret Key:</span>
                      <span className="text-cyan-300 font-bold">JBSWY3DPEHPK3PXP</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-cyan-500/20 text-xs text-gray-300">
                    <h5 className="font-bold text-white flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-cyan-400" /> Setup Instructions:
                    </h5>
                    <ol className="list-decimal list-inside space-y-1 text-gray-400 text-[11px]">
                      <li>Open the <strong>Microsoft Authenticator</strong> app on your iPhone or Android phone.</li>
                      <li>Tap <strong>+ (Add Account)</strong> and select <strong>Work or school account</strong> or <strong>Other account</strong>.</li>
                      <li>Enter secret key <code className="text-cyan-300 font-mono font-bold">JBSWY3DPEHPK3PXP</code> or scan account code.</li>
                      <li>Use the generated 6-digit code during corporate sign-in.</li>
                    </ol>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className="px-5 py-2.5 bg-amber-500 text-black font-bold text-xs rounded-xl hover:bg-amber-400 transition"
                  >
                    Proceed To Sign-In
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: Request Corporate Access Form */}
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
                      Approved Corporate Email Address <span className="text-rose-400">*</span>
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
                        {availableRoles.filter(r => r !== 'System Administrator').map(roleOpt => (
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
                      Primary Location / Base Yard
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
                    <span>Submit Request & Email Credentials</span>
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
            <span>ISO 27001 TLS-Encrypted Corporate Gateway</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-500 font-mono text-[10px]">
            <span>Domain Whitelisting</span>
            <span>•</span>
            <span>MS Authenticator 2FA</span>
            <span>•</span>
            <span>Email Token Verification</span>
          </div>
        </div>

      </div>
    </div>
  );
};


