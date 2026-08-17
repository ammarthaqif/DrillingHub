import React, { useState, useEffect } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { safeJsonParse } from '../utils/safeJson';
import { 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  Mail, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Shield, 
  Loader2, 
  Send, 
  KeyRound, 
  UserCheck
} from 'lucide-react';

export const AuthGate: React.FC = () => {
  const { 
    loginUser, 
    sendEmailCredentialsServer,
    sendAuthTokenEmail,
    resetPasswordWithToken,
    provisionSystemAdminAccount,
    systemConfig,
    logoutNotice,
  } = useDrilling();

  const [activeTab, setActiveTab] = useState<'credentials' | 'password-setup'>('credentials');
  
  // Confidential Sign-In State
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isDispatchingEmail, setIsDispatchingEmail] = useState(false);

  // Password Setup / Reset State
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSendingToken, setIsSendingToken] = useState(false);

  // Notice & Errors
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pending Concurrent Login Request state
  const [pendingRequestInfo, setPendingRequestInfo] = useState<{
    requestId: string;
    requestingUserId: string;
    activeUser?: { name: string; role: string };
  } | null>(null);

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
                const res = loginUser(pendingRequestInfo.requestingUserId, password, { overrideActiveSession: true });
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
  }, [pendingRequestInfo, password, loginUser]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailTrim = loginEmail.trim().toLowerCase();
    if (!emailTrim) {
      setErrorMsg('Please enter your administrator-authorized corporate email address.');
      return;
    }

    if (emailTrim === 'admin@apexdrilling.com') {
      provisionSystemAdminAccount();
    }

    const res = loginUser(emailTrim, password);

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
      setErrorMsg('Please enter a valid administrator-provisioned corporate email address.');
      return;
    }

    setIsSendingToken(true);
    const res = await sendAuthTokenEmail(emailTrim);
    setIsSendingToken(false);

    if (res.success) {
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
        setActiveTab('credentials');
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

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      
      {/* Background Decorative Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Restricted Gateway Card */}
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
                    Restricted Gateway
                  </span>
                </div>
                <p className="text-xs text-gray-400">Campaign Tubular & Materials Inventory Engine</p>
              </div>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold self-start sm:self-auto">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin-Authorized Users Only</span>
            </div>
          </div>

          {/* Strict Admin-Granted Access Notice Banner */}
          <div className="mt-4 p-3.5 rounded-xl bg-black/60 border border-white/5 flex items-start space-x-2.5 text-xs text-gray-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="leading-relaxed">
                <strong>AUTHORIZED PERSONNEL ACCESS ONLY:</strong> Access is strictly restricted to personnel whose user profiles have been provisioned and approved by the System Administrator.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-gray-400">
                <span className="text-gray-500">Approved Corporate Domains:</span>
                {systemConfig.corporateDomains.slice(0, 5).map(d => (
                  <span key={d} className="px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono text-[10px]">
                    @{d}
                  </span>
                ))}
                {systemConfig.corporateDomains.length > 5 && (
                  <span className="text-[10px] text-gray-500">+{systemConfig.corporateDomains.length - 5} more</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/40 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('credentials'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3.5 px-5 text-xs font-bold transition flex items-center justify-center space-x-2 border-b-2 whitespace-nowrap flex-1 ${
              activeTab === 'credentials'
                ? 'border-amber-500 text-amber-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Authorized Sign-In</span>
          </button>

          <button
            onClick={() => { setActiveTab('password-setup'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3.5 px-5 text-xs font-bold transition flex items-center justify-center space-x-2 border-b-2 whitespace-nowrap flex-1 ${
              activeTab === 'password-setup'
                ? 'border-amber-500 text-amber-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Password Setup & Reset</span>
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
                Single Active Session Policy
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
            {/* TAB 1: Authorized Corporate Credentials Sign-In */}
            {activeTab === 'credentials' && (
              <div className="p-6 sm:p-8 space-y-5">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                      Authorized Corporate Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="e.g. admin@apexdrilling.com or s.jenkins@apexdrilling.com"
                        className="w-full bg-black/70 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        Password / Security Passphrase
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(loginEmail);
                          setActiveTab('password-setup');
                        }}
                        className="text-[10px] text-amber-400 hover:underline font-mono"
                      >
                        Set / Reset Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password..."
                        className="w-full bg-black/70 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
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
                    >
                      {isDispatchingEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      ) : (
                        <Send className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>Email Auth Token</span>
                    </button>
                  </div>
                </form>

                {/* Security Governance Notice */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs text-gray-300">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Access Control Policy</span>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Access is restricted exclusively to personnel whose profiles have been provisioned by a System Administrator. For account setup or role changes, contact your IT Operations or Well Engineering administrator.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: Authorized Account Password Setup / Reset */}
            {activeTab === 'password-setup' && (
              <div className="p-6 sm:p-8 space-y-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Authorized Account Password Setup & Reset</span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Set up or reset your secure login password using your corporate authorization verification token.
                  </p>
                </div>

                <div className="space-y-3 p-4 bg-black/50 border border-white/10 rounded-2xl">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Step 1: Request Security Verification Token
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter authorized corporate email..."
                      className="flex-1 bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendAuthorizationToken}
                      disabled={isSendingToken}
                      className="px-4 py-2.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 whitespace-nowrap"
                    >
                      {isSendingToken ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Request Token</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-3 p-4 bg-black/50 border border-white/10 rounded-2xl">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Step 2: Enter Token & New Password
                  </label>
                  
                  <div>
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="6-digit verification token (e.g. 784921)..."
                      className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:border-amber-500 mb-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min 6 chars)..."
                      className="bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:border-amber-500"
                    />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password..."
                      className="bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-amber-500 text-black font-extrabold text-xs rounded-xl hover:bg-amber-400 transition flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Password & Return to Sign In</span>
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
            <span>Admin-Authorized Directory</span>
            <span>•</span>
            <span>Zero-Trust Access Control</span>
            <span>•</span>
            <span>RBAC Protected</span>
          </div>
        </div>

      </div>
    </div>
  );
};
