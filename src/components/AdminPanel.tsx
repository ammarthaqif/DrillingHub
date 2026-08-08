import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { UserRole, UserAccountStatus, UserProfile } from '../types/drilling';
import { 
  Users, 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  RefreshCw, 
  Building2, 
  Settings, 
  Database, 
  Send, 
  ExternalLink, 
  UserPlus, 
  Key, 
  Lock, 
  Download, 
  Upload, 
  Sliders, 
  Copy, 
  Check, 
  Radio, 
  Globe,
  Sparkles,
  Inbox,
  Clock,
  Shield
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { 
    currentUser, 
    allUsers, 
    registerUser, 
    updateUserStatus, 
    updateUserRole, 
    resendVerificationEmail, 
    verifyEmailWithToken,
    emailOutbox,
    systemConfig,
    updateSystemConfig,
    addCorporateDomain,
    removeCorporateDomain,
    exportDatabaseSnapshot,
    resetDatabaseToInitial
  } = useDrilling();

  const [activeTab, setActiveTab] = useState<'users' | 'emailConfig' | 'sysConfig' | 'database'>('users');
  
  // Registration Form State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Drilling Engineer');
  const [regDepartment, setRegDepartment] = useState('Drilling Operations');
  const [regLocation, setRegLocation] = useState('Main Supply Base Yard' as any);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Email Domain Input
  const [newDomain, setNewDomain] = useState('');
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // User Filter
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');
  const [searchUserQuery, setSearchUserQuery] = useState('');

  // Selected Email Preview
  const [selectedEmailLog, setSelectedEmailLog] = useState<any | null>(null);

  // Form Submit for New Corporate User Registration
  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regName.trim() || !regEmail.trim()) {
      setRegError('Please fill in both name and corporate email address.');
      return;
    }

    const emailDomain = regEmail.split('@')[1]?.toLowerCase();
    if (!emailDomain) {
      setRegError('Invalid email format. Please provide a valid email (e.g. engineer@petronas.com).');
      return;
    }

    const isDomainAllowed = systemConfig.corporateDomains.some(d => d.toLowerCase() === emailDomain);
    if (!isDomainAllowed) {
      setRegError(`Domain "@${emailDomain}" is not in the approved corporate list. Allowed domains: ${systemConfig.corporateDomains.join(', ')}`);
      return;
    }

    const result = registerUser({
      name: regName.trim(),
      email: regEmail.trim(),
      role: regRole,
      department: regDepartment,
      location: regLocation,
    });

    if (!result.success) {
      setRegError(result.message);
    } else {
      setRegSuccess(`Corporate registration initiated for ${regEmail}. Validation email token generated & sent!`);
      setRegName('');
      setRegEmail('');
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegSuccess(null);
      }, 2000);
    }
  };

  const handleCopyToken = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const filteredUsers = allUsers.filter(u => {
    if (userStatusFilter !== 'ALL' && (u.status || 'Active Approved') !== userStatusFilter) return false;
    if (searchUserQuery) {
      const q = searchUserQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingVerificationCount = allUsers.filter(u => u.status === 'Pending Email Verification').length;
  const pendingApprovalCount = allUsers.filter(u => u.status === 'Pending Admin Approval').length;
  const activeUsersCount = allUsers.filter(u => (u.status || 'Active Approved') === 'Active Approved').length;

  return (
    <div className="space-y-6">
      
      {/* Admin Panel Header & Stats */}
      <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-tight">System Administration & Access Control</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                  RBAC & Validation Portal
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Manage corporate user registration, domain whitelist validation, email verification tokens & embedded database configuration
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition shadow-lg flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Corporate User</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-400 text-[11px]">Active Approved Users</p>
              <p className="text-lg font-extrabold text-white">{activeUsersCount}</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-400 text-[11px]">Pending Email Verifications</p>
              <p className="text-lg font-extrabold text-amber-400">{pendingVerificationCount}</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-400 text-[11px]">Pending Admin Approvals</p>
              <p className="text-lg font-extrabold text-cyan-300">{pendingApprovalCount}</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-400 text-[11px]">Approved Corporate Domains</p>
              <p className="text-lg font-extrabold text-purple-300">{systemConfig.corporateDomains.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/10 space-x-2 text-xs font-semibold overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'users' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory & RBAC ({allUsers.length})</span>
          {(pendingVerificationCount > 0 || pendingApprovalCount > 0) && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-extrabold">
              {pendingVerificationCount + pendingApprovalCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('emailConfig')}
          className={`px-4 py-3 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'emailConfig' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Corporate Email Validation & Outbox ({emailOutbox.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sysConfig')}
          className={`px-4 py-3 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'sysConfig' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>System Parameters & ERP Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-3 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'database' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Embedded Real-Time DB Engine</span>
        </button>
      </div>

      {/* TAB 1: USER REGISTRATION & ACCESS CONTROL */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          
          {/* Filters & Search */}
          <div className="bg-[#111114] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-gray-400 font-medium shrink-0">Filter Status:</span>
              {['ALL', 'Pending Email Verification', 'Pending Admin Approval', 'Active Approved', 'Suspended'].map(st => (
                <button
                  key={st}
                  onClick={() => setUserStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl shrink-0 transition font-medium ${
                    userStatusFilter === st 
                      ? 'bg-amber-500 text-black font-bold shadow' 
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {st === 'ALL' ? 'All Users' : st}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search user name or email..."
                value={searchUserQuery}
                onChange={e => setSearchUserQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* User Table */}
          <div className="bg-[#111114] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/5 text-gray-400 border-b border-white/10 font-medium uppercase text-[10px]">
                    <th className="p-3.5">User Identity</th>
                    <th className="p-3.5">Corporate Domain</th>
                    <th className="p-3.5">Assigned Role & Department</th>
                    <th className="p-3.5">Status Lifecycle</th>
                    <th className="p-3.5">Registration Info</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-200">
                  {filteredUsers.map((user) => {
                    const domain = user.email.split('@')[1];
                    const isApproved = (user.status || 'Active Approved') === 'Active Approved';
                    const isPendingVerify = user.status === 'Pending Email Verification';
                    const isPendingApprove = user.status === 'Pending Admin Approval';

                    return (
                      <tr key={user.id} className="hover:bg-white/5 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-white">{user.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono flex items-center space-x-1 mt-0.5">
                            <Mail className="w-3 h-3 text-amber-400" />
                            <span>{user.email}</span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                            @{domain}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-amber-300">{user.role}</div>
                          <div className="text-[11px] text-gray-400">{user.department} • {user.location}</div>
                        </td>

                        <td className="p-3.5">
                          {isApproved && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active Approved</span>
                            </span>
                          )}
                          {isPendingVerify && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold inline-flex items-center space-x-1 animate-pulse">
                              <Clock className="w-3 h-3" />
                              <span>Pending Verification</span>
                            </span>
                          )}
                          {isPendingApprove && (
                            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold inline-flex items-center space-x-1">
                              <Shield className="w-3 h-3" />
                              <span>Pending Approval</span>
                            </span>
                          )}
                          {user.status === 'Suspended' && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold inline-flex items-center space-x-1">
                              <XCircle className="w-3 h-3" />
                              <span>Suspended</span>
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-gray-400 text-[11px] font-mono">
                          <div>Registered: {user.registeredAt || '2026-08-01'}</div>
                          {user.verificationToken && (
                            <div className="text-[10px] text-amber-400/80 mt-0.5 truncate max-w-[120px]">
                              Token: {user.verificationToken}
                            </div>
                          )}
                        </td>

                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {/* Quick Actions */}
                          {isPendingVerify && user.verificationToken && (
                            <button
                              onClick={() => verifyEmailWithToken(user.verificationToken!)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold transition"
                              title="Simulate user clicking email validation link"
                            >
                              Simulate Verify Email
                            </button>
                          )}

                          {isPendingApprove && (
                            <button
                              onClick={() => updateUserStatus(user.id, 'Active Approved')}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 text-[11px] font-bold transition"
                            >
                              Approve Access
                            </button>
                          )}

                          <button
                            onClick={() => resendVerificationEmail(user.id)}
                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-medium transition"
                            title="Resend corporate validation email"
                          >
                            Resend Email
                          </button>

                          {isApproved ? (
                            <button
                              onClick={() => updateUserStatus(user.id, 'Suspended')}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-medium transition"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserStatus(user.id, 'Active Approved')}
                              className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-medium transition"
                            >
                              Set Active
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CORPORATE EMAIL VALIDATION & OUTBOX */}
      {activeTab === 'emailConfig' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Domain Whitelist Config */}
          <div className="bg-[#111114] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
              <Globe className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white text-sm">Approved Corporate Email Domains</h3>
            </div>

            <p className="text-xs text-gray-400">
              Only users registering with verified corporate domain emails will be accepted into the campaign management system.
            </p>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (newDomain.trim()) {
                  addCorporateDomain(newDomain.trim());
                  setNewDomain('');
                }
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                placeholder="e.g. totalenergies.com"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-400 transition"
              >
                Add Domain
              </button>
            </form>

            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Active Whitelisted Domains ({systemConfig.corporateDomains.length})</p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {systemConfig.corporateDomains.map((dom) => (
                  <div key={dom} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5 text-xs font-mono">
                    <span className="text-purple-300 font-semibold">@{dom}</span>
                    <button
                      onClick={() => removeCorporateDomain(dom)}
                      className="text-gray-500 hover:text-rose-400 text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <label className="flex items-center space-x-2 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={systemConfig.autoApproveVerifiedCorporateEmails}
                  onChange={(e) => updateSystemConfig({ autoApproveVerifiedCorporateEmails: e.target.checked })}
                  className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-0"
                />
                <span>Auto-Approve verified corporate email accounts</span>
              </label>
            </div>
          </div>

          {/* Verification Email Outbox & Simulator Log */}
          <div className="lg:col-span-2 bg-[#111114] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Inbox className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Corporate Email Verification Outbox Log</h3>
              </div>
              <span className="text-xs text-gray-400 font-mono">{emailOutbox.length} dispatched records</span>
            </div>

            <p className="text-xs text-gray-400">
              Simulated corporate SMTP email pipeline. You can review tokens, copy verification links, or trigger instant click verification for testing.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {emailOutbox.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs italic bg-white/5 rounded-xl">
                  No email verification dispatch logs found.
                </div>
              ) : (
                emailOutbox.map((mail) => (
                  <div key={mail.id} className="p-3.5 bg-white/5 border border-white/5 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        <span>To: {mail.recipientEmail} ({mail.userName})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        mail.status === 'Verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      }`}>
                        {mail.status}
                      </span>
                    </div>

                    <div className="bg-black/40 p-2.5 rounded-xl font-mono text-[11px] text-gray-300 flex items-center justify-between border border-white/5">
                      <span className="truncate max-w-sm">Token: <strong className="text-amber-400">{mail.token}</strong></span>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => handleCopyToken(mail.token, mail.id)}
                          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-300 text-[10px] flex items-center space-x-1"
                        >
                          {copiedTokenId === mail.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedTokenId === mail.id ? 'Copied' : 'Copy Token'}</span>
                        </button>
                        
                        {mail.status !== 'Verified' && (
                          <button
                            onClick={() => verifyEmailWithToken(mail.token)}
                            className="px-2 py-1 rounded bg-emerald-500 text-black font-bold text-[10px] hover:bg-emerald-400 transition"
                          >
                            Simulate Link Click
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>Sent: {mail.sentAt}</span>
                      <span>Domain Check: <strong className="text-purple-300 font-mono">@{mail.corporateDomain}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: SYSTEM CONFIGURATION & ERP SETTINGS */}
      {activeTab === 'sysConfig' && (
        <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>Campaign Inspection Intervals & VISMA ERP Configuration</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Configure default Recertification due cycles per tubular category and VISMA ERP synchronizers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            {/* Inspection Intervals */}
            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Category Recertification Due Days</h4>
              
              <div className="space-y-2">
                {Object.entries(systemConfig.defaultInspectionIntervalDays).map(([cat, days]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-gray-300 font-medium">{cat}</span>
                    <input
                      type="number"
                      value={days}
                      onChange={(e) => {
                        const newDays = Number(e.target.value);
                        updateSystemConfig({
                          defaultInspectionIntervalDays: {
                            ...systemConfig.defaultInspectionIntervalDays,
                            [cat]: newDays
                          }
                        });
                      }}
                      className="w-24 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-amber-300 font-mono text-right focus:border-amber-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* VISMA ERP Parameters */}
            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
              <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px]">VISMA ERP API & Charge Code Sync</h4>

              <div>
                <label className="block text-gray-400 mb-1">Default Campaign AFE / Well Charge Code</label>
                <input
                  type="text"
                  value={systemConfig.defaultAfeCode}
                  onChange={e => updateSystemConfig({ defaultAfeCode: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-amber-300 font-mono focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">VISMA Sync Endpoint URL</label>
                <input
                  type="text"
                  value={systemConfig.vismaEndpointUrl}
                  onChange={e => updateSystemConfig({ vismaEndpointUrl: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-mono focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center space-x-2 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={systemConfig.vismaErpSyncEnabled}
                    onChange={e => updateSystemConfig({ vismaErpSyncEnabled: e.target.checked })}
                    className="rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-0"
                  />
                  <span>Enable Automatic Background VISMA Sync</span>
                </label>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  systemConfig.vismaErpSyncEnabled ? 'bg-cyan-500/20 text-cyan-300' : 'bg-gray-800 text-gray-500'
                }`}>
                  {systemConfig.vismaErpSyncEnabled ? 'Active Sync' : 'Disabled'}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: EMBEDDED REAL-TIME DB ENGINE */}
      {activeTab === 'database' && (
        <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span>Embedded Real-Time Database Engine Status</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Zero-config IndexedDB + LocalStorage persistence layer with real-time BroadcastChannel multi-tab pub/sub
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-Time Engine Active</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
              <p className="font-semibold text-gray-400">IndexedDB Object Store</p>
              <p className="text-xl font-bold text-white">DrillSpec_Embedded_Realtime_DB v1</p>
              <p className="text-emerald-400 text-[11px] font-mono">Status: Connected & Synchronized</p>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
              <p className="font-semibold text-gray-400">BroadcastChannel Pub/Sub</p>
              <p className="text-xl font-bold text-amber-400">drillspec_realtime_channel</p>
              <p className="text-gray-400 text-[11px]">Real-time tab synchronization ready</p>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
              <p className="font-semibold text-gray-400">Export / Import Backup</p>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={exportDatabaseSnapshot}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-[11px] hover:bg-emerald-400 transition flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>

                <button
                  onClick={resetDatabaseToInitial}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 font-bold text-[11px] transition"
                >
                  Reset DB
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW USER REGISTRATION MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-xs text-gray-200">
            
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Register Corporate User & Dispatch Email</h3>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterUser} className="p-6 space-y-4">
              
              {regError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Full User Name *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. Capt. David Miller"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Corporate Email Address *</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="e.g. david.miller@petronas.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Allowed domains: {systemConfig.corporateDomains.join(', ')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Assigned Role</label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value as UserRole)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Drilling Engineer" className="bg-[#141417]">Drilling Engineer</option>
                    <option value="System Administrator" className="bg-[#141417]">System Administrator</option>
                    <option value="Logistics Coordinator" className="bg-[#141417]">Logistics Coordinator</option>
                    <option value="Materials Coordinator (Supply Base)" className="bg-[#141417]">Materials Coordinator</option>
                    <option value="Rig Toolpusher / Materials Specialist" className="bg-[#141417]">Rig Toolpusher</option>
                    <option value="QA/QC Inspector" className="bg-[#141417]">QA/QC Inspector</option>
                    <option value="Auditor / Management" className="bg-[#141417]">Auditor / Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Department</label>
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={e => setRegDepartment(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition"
                >
                  Register & Send Email Token
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
