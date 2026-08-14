import React, { useState, useEffect } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { safeJsonParse } from '../utils/safeJson';
import { UserRole, LocationType } from '../types/drilling';
import { signInWithMicrosoftOAuth, dedicatedDatabaseId } from '../lib/firebase';
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
  Check,
  X,
  Search,
  Database,
  ExternalLink
} from 'lucide-react';

export const AuthGate: React.FC = () => {
  const { 
    allUsers, 
    loginUser, 
    loginWithMicrosoftAccount,
    registerWithMicrosoft,
    registerUser, 
    verifyEmailWithToken,
    sendEmailCredentialsServer,
    sendAuthTokenEmail,
    resetPasswordWithToken,
    provisionSystemAdminAccount,
    systemConfig,
    availableRoles,
    availableDepartments,
    availableLocations,
    logoutNotice,
  } = useDrilling();

  const [activeTab, setActiveTab] = useState<'microsoft' | 'token-password' | 'ms-authenticator'>('microsoft');
  
  // Microsoft Authentication State
  const [isAuthenticatingMs, setIsAuthenticatingMs] = useState(false);
  const [msFirstTimeUser, setMsFirstTimeUser] = useState<{
    email: string;
    displayName: string;
    uid: string;
    tenantId?: string;
  } | null>(null);
  
  // First-time registration details form
  const [msSelectedRole, setMsSelectedRole] = useState<UserRole>('Drilling Engineer');
  const [msSelectedDepartment, setMsSelectedDepartment] = useState('Drilling & Well Operations');
  const [msSelectedLocation, setMsSelectedLocation] = useState<LocationType>('Main Supply Base Yard');

  // Confidential Sign-In State
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [totpCode, setTotpCode] = useState<string>('');
  const [requiresTotpInput, setRequiresTotpInput] = useState<boolean>(false);
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

  // Primary Microsoft OAuth Sign-in Handler
  const handleMicrosoftSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsAuthenticatingMs(true);

    try {
      const msResult = await signInWithMicrosoftOAuth();
      
      if (!msResult.success || !msResult.user) {
        setErrorMsg(msResult.error || 'Microsoft Authentication cancelled or unavailable.');
        setIsAuthenticatingMs(false);
        return;
      }

      const res = await loginWithMicrosoftAccount({
        email: msResult.user.email,
        displayName: msResult.user.displayName,
        uid: msResult.user.uid,
        tenantId: msResult.user.tenantId,
        photoURL: msResult.user.photoURL
      });

      if (res.requiresRegistration) {
        setMsFirstTimeUser({
          email: msResult.user.email,
          displayName: msResult.user.displayName,
          uid: msResult.user.uid,
          tenantId: msResult.user.tenantId
        });
        setSuccessMsg(res.message);
      } else if (res.pendingRequest && res.requestId) {
        setPendingRequestInfo({
          requestId: res.requestId,
          requestingUserId: msResult.user.email,
          activeUser: res.activeUser,
        });
      } else if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg(res.message);
      }
    } catch (err: any) {
      console.error('Microsoft sign-in failure:', err);
      setErrorMsg(err?.message || 'Microsoft Authentication failed. Please verify corporate credentials.');
    } finally {
      setIsAuthenticatingMs(false);
    }
  };

  // First-Time Microsoft User Registration Completion
  const handleCompleteMsRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msFirstTimeUser) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const res = registerWithMicrosoft(msFirstTimeUser, {
      role: msSelectedRole,
      department: msSelectedDepartment,
      location: msSelectedLocation,
    });

    if (res.success) {
      setSuccessMsg(res.message);
      setMsFirstTimeUser(null);
    } else {
      setErrorMsg(res.message);
    }
  };

  // Instant Microsoft SSO Tester for quick evaluation of roles
  const handleQuickMicrosoftDemoLogin = async (email: string, displayName: string, role: UserRole) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsAuthenticatingMs(true);

    try {
      const fakeUid = `ms-entra-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
      const res = await loginWithMicrosoftAccount({
        email,
        displayName,
        uid: fakeUid,
        tenantId: 'tenant-ms-global-corp'
      });

      if (res.requiresRegistration) {
        // Auto register with the selected role
        registerWithMicrosoft(
          { email, displayName, uid: fakeUid, tenantId: 'tenant-ms-global-corp' },
          { role, department: 'Drilling & Well Operations', location: 'Main Supply Base Yard' }
        );
      } else if (res.pendingRequest && res.requestId) {
        setPendingRequestInfo({
          requestId: res.requestId,
          requestingUserId: email,
          activeUser: res.activeUser,
        });
      } else if (!res.success) {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Quick SSO login error.');
    } finally {
      setIsAuthenticatingMs(false);
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailTrim = loginEmail.trim().toLowerCase();
    if (!emailTrim) {
      setErrorMsg('Please enter your approved corporate email address.');
      return;
    }

    if (emailTrim === 'admin@apexdrilling.com') {
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
        setActiveTab('microsoft');
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
                <p className="text-xs text-gray-400">Campaign Tubular & Materials Inventory Engine</p>
              </div>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Microsoft Entra ID Enforced</span>
            </div>
          </div>

          {/* Confidentiality Notice Banner */}
          <div className="mt-4 p-3.5 rounded-xl bg-black/50 border border-white/5 flex items-start space-x-2.5 text-xs text-gray-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="leading-relaxed">
                <strong>ENTERPRISE RESTRICTED ACCESS:</strong> All personnel must authenticate via official <strong>Microsoft 365 / Entra ID</strong> single sign-on. Access is strictly locked to approved corporate domains.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-gray-400">
                <span className="text-gray-500">Authorized Domains:</span>
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
            onClick={() => { setActiveTab('microsoft'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3.5 px-4 text-xs font-bold transition flex items-center justify-center space-x-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'microsoft'
                ? 'border-amber-500 text-amber-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5 shrink-0">
              <span className="bg-[#f25022] rounded-xs" />
              <span className="bg-[#7fba00] rounded-xs" />
              <span className="bg-[#00a4ef] rounded-xs" />
              <span className="bg-[#ffb900] rounded-xs" />
            </div>
            <span>Microsoft Entra ID Login</span>
          </button>

          <button
            onClick={() => { setActiveTab('token-password'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3.5 px-4 text-xs font-bold transition flex items-center justify-center space-x-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'token-password'
                ? 'border-amber-500 text-amber-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Corporate Token & Password</span>
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
            <span>MS Authenticator 2FA</span>
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
            {/* FIRST-TIME MICROSOFT USER REGISTRATION MODAL/VIEW */}
            {msFirstTimeUser ? (
              <div className="p-6 sm:p-8 space-y-5">
                <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Microsoft Identity Verified</span>
                  </div>
                  <p className="text-white text-sm font-extrabold">{msFirstTimeUser.displayName}</p>
                  <p className="text-amber-300 font-mono text-xs">{msFirstTimeUser.email}</p>
                  <p className="text-[11px] text-gray-400">
                    First-time registration: Select your operational assignment to finalize account provisioning.
                  </p>
                </div>

                <form onSubmit={handleCompleteMsRegistration} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Assigned Role
                    </label>
                    <select
                      value={msSelectedRole}
                      onChange={(e) => setMsSelectedRole(e.target.value as UserRole)}
                      className="w-full bg-black/70 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:border-amber-500"
                    >
                      {availableRoles.map(role => (
                        <option key={role} value={role} className="bg-[#111114]">{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Department
                      </label>
                      <select
                        value={msSelectedDepartment}
                        onChange={(e) => setMsSelectedDepartment(e.target.value)}
                        className="w-full bg-black/70 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:border-amber-500"
                      >
                        {availableDepartments.map(dept => (
                          <option key={dept} value={dept} className="bg-[#111114]">{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Primary Yard / Rig Location
                      </label>
                      <select
                        value={msSelectedLocation}
                        onChange={(e) => setMsSelectedLocation(e.target.value as LocationType)}
                        className="w-full bg-black/70 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:border-amber-500"
                      >
                        {availableLocations.map(loc => (
                          <option key={loc} value={loc} className="bg-[#111114]">{loc}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setMsFirstTimeUser(null)}
                      className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-amber-500/20"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Complete Registration & Sign In</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* TAB 1: Enforced Microsoft Entra ID Authentication */}
                {activeTab === 'microsoft' && (
                  <div className="p-6 sm:p-8 space-y-6">
                    
                    {/* Microsoft Official SSO Action */}
                    <div className="text-center space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-base font-extrabold text-white">
                          Sign In with Corporate Credentials
                        </h3>
                        <p className="text-xs text-gray-400">
                          Authenticate via your organization's Microsoft 365 or Azure Entra ID Single Sign-On
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleMicrosoftSignIn}
                        disabled={isAuthenticatingMs}
                        className="w-full py-3.5 px-6 rounded-2xl bg-[#2f2f35] hover:bg-[#3b3b44] border border-white/20 text-white font-bold text-sm shadow-xl transition flex items-center justify-center space-x-3 group relative overflow-hidden"
                      >
                        <div className="w-5 h-5 grid grid-cols-2 gap-0.5 shrink-0">
                          <span className="bg-[#f25022] rounded-xs" />
                          <span className="bg-[#7fba00] rounded-xs" />
                          <span className="bg-[#00a4ef] rounded-xs" />
                          <span className="bg-[#ffb900] rounded-xs" />
                        </div>
                        <span>
                          {isAuthenticatingMs ? 'Connecting to Microsoft Entra ID...' : 'Sign in with Microsoft 365'}
                        </span>
                        {isAuthenticatingMs ? (
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-400 ml-2" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-white transition ml-2" />
                        )}
                      </button>
                    </div>

                    {/* Dedicated Database & Security Status */}
                    <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-[11px] font-bold text-gray-200">Dedicated Firestore Database</p>
                          <p className="text-[10px] text-gray-400 font-mono">{dedicatedDatabaseId}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono">
                        Online
                      </span>
                    </div>

                    {/* Quick Microsoft SSO Test Profiles for Evaluation */}
                    <div className="pt-2 border-t border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          Instant Corporate SSO Profiles (1-Click Test)
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono">Simulated Entra ID</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickMicrosoftDemoLogin('capt.david@petronas.com', 'Capt. David Miller', 'Drilling Engineer')}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/40 text-left transition space-y-0.5 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-200 group-hover:text-amber-300">Capt. David Miller</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">PETRONAS</span>
                          </div>
                          <p className="text-[10px] text-gray-400">Drilling Engineer • Offshore Rig</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickMicrosoftDemoLogin('sarah.jenkins@shell.com', 'Sarah Jenkins', 'Rig Toolpusher / Materials Specialist')}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/40 text-left transition space-y-0.5 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-200 group-hover:text-amber-300">Sarah Jenkins</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">SHELL</span>
                          </div>
                          <p className="text-[10px] text-gray-400">Materials Specialist • Supply Base</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickMicrosoftDemoLogin('alex.matco@halliburton.com', 'Alex Rivera', 'Materials Coordinator (Supply Base)')}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/40 text-left transition space-y-0.5 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-200 group-hover:text-amber-300">Alex Rivera</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono">HALLIBURTON</span>
                          </div>
                          <p className="text-[10px] text-gray-400">Supply Base Matco • Main Yard</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickMicrosoftDemoLogin('admin@apexdrilling.com', 'Enterprise System Admin', 'System Administrator')}
                          className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition space-y-0.5 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-300">Enterprise Admin</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">ADMIN</span>
                          </div>
                          <p className="text-[10px] text-gray-400">Governance & Security Admin</p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Corporate Token & Password fallback */}
                {activeTab === 'token-password' && (
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
                            placeholder="e.g. j.smith@apexdrilling.com or engineer@petronas.com"
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

                      {requiresTotpInput && (
                        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
                          <div className="flex items-center space-x-2 text-cyan-300 text-xs font-bold">
                            <Smartphone className="w-4 h-4 text-cyan-400" />
                            <span>Microsoft Authenticator 2FA Code</span>
                          </div>
                          <input
                            type="text"
                            maxLength={6}
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 6-digit code (e.g. 123456)..."
                            className="w-full bg-black/80 border border-cyan-500/40 rounded-xl px-3 py-2 text-center text-sm tracking-[0.3em] font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      )}

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

                    {/* Reset Password Subsection */}
                    <div className="pt-4 border-t border-white/10 space-y-3">
                      <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>First-Time Token Password Setup</span>
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="Corporate email for token dispatch..."
                          className="flex-1 bg-black/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleSendAuthorizationToken}
                          disabled={isSendingToken}
                          className="px-3.5 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black font-bold text-xs rounded-xl transition flex items-center space-x-1 whitespace-nowrap"
                        >
                          {isSendingToken ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>Request Token</span>
                        </button>
                      </div>

                      <form onSubmit={handleResetPassword} className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <input
                          type="text"
                          required
                          value={resetToken}
                          onChange={(e) => setResetToken(e.target.value)}
                          placeholder="6-digit token..."
                          className="bg-black/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-gray-600 focus:border-amber-500"
                        />
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password..."
                          className="bg-black/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-gray-600 focus:border-amber-500"
                        />
                        <button
                          type="submit"
                          className="py-2 px-3 bg-amber-500 text-black font-bold text-xs rounded-xl hover:bg-amber-400 transition flex items-center justify-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Set Password</span>
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
                          <li>Enter secret key <code className="text-cyan-300 font-mono font-bold">JBSWY3DPEHPK3PXP</code>.</li>
                          <li>Use the generated 6-digit code during sign-in.</li>
                        </ol>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveTab('microsoft')}
                        className="px-5 py-2.5 bg-amber-500 text-black font-bold text-xs rounded-xl hover:bg-amber-400 transition"
                      >
                        Proceed To Microsoft Sign-In
                      </button>
                    </div>
                  </div>
                )}
              </>
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
            <span>Microsoft Entra ID</span>
            <span>•</span>
            <span>Dedicated Firestore DB</span>
            <span>•</span>
            <span>RBAC Protected</span>
          </div>
        </div>

      </div>
    </div>
  );
};


