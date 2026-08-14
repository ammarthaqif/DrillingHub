import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { UserRole, UserAccountStatus, UserProfile, LocationType } from '../types/drilling';
import { DropdownCategoryKey } from '../db/embeddedDb';
import { ApprovedUsersUploadModal } from './ApprovedUsersUploadModal';
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
  Shield,
  Trash2,
  RotateCcw,
  MapPin,
  Layers,
  HardHat,
  Wrench,
  Truck,
  Tag,
  ChevronRight,
  ListFilter,
  Pencil,
  UserX,
  UserCheck
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { 
    currentUser, 
    allUsers, 
    registerUser, 
    updateUserStatus, 
    updateUserRole, 
    updateUser,
    deleteUser,
    revokeUserAccess,
    resendVerificationEmail, 
    sendEmailCredentialsServer,
    verifyEmailWithToken,
    emailOutbox,
    systemConfig,
    updateSystemConfig,
    addCorporateDomain,
    removeCorporateDomain,
    exportDatabaseSnapshot,
    resetDatabaseToInitial,
    migrateDatabaseToDedicatedFirestore,
    testDedicatedFirestoreConnection,
    dedicatedDatabaseId,
    isMigratingToDedicatedDb,
    availableRoles,
    availableDepartments,
    availableLocations,
    availableHoleSections,
    availableCategories,
    availableEquipmentConditions,
    availableMaintenanceStatuses,
    availableCarrierTypes,
    addDropdownOption,
    removeDropdownOption,
    resetDropdownOptions,
    roleModulePermissions,
    updateRoleModulePermissions,
    resetRoleModulePermissions,
    hasModuleAccess
  } = useDrilling();

  const [activeTab, setActiveTab] = useState<'users' | 'emailConfig' | 'dropdowns' | 'sysConfig' | 'database' | 'moduleAccess'>('users');
  
  // Dropdown Manager State
  const [selectedDropdownCategory, setSelectedDropdownCategory] = useState<DropdownCategoryKey>('roles');
  const [newOptionText, setNewOptionText] = useState('');
  const [dropdownMsg, setDropdownMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Upload Excel Approved Users Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Registration Form State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Drilling Engineer');
  const [regDepartment, setRegDepartment] = useState('Drilling Operations');
  const [regLocation, setRegLocation] = useState<LocationType>('Main Supply Base Yard');
  const [regStatusOption, setRegStatusOption] = useState<UserAccountStatus>('Active Approved');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Drilling Engineer');
  const [editDepartment, setEditDepartment] = useState('');
  const [editLocation, setEditLocation] = useState<LocationType>('Main Supply Base Yard');
  const [editStatus, setEditStatus] = useState<UserAccountStatus>('Active Approved');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Delete User Modal State
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Dedicated Firebase Database Migration State
  const [migrationOutput, setMigrationOutput] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  // Open Edit User Modal
  const handleOpenEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditDepartment(user.department);
    setEditLocation(user.location || 'Main Supply Base Yard');
    setEditStatus(user.status || 'Active Approved');
    setEditError(null);
    setEditSuccess(null);
  };

  // Submit Edit User
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    setEditSuccess(null);

    if (!editName.trim() || !editEmail.trim()) {
      setEditError('Please fill in name and email address.');
      return;
    }

    const res = updateUser(editingUser.id, {
      name: editName.trim(),
      email: editEmail.trim(),
      role: editRole,
      department: editDepartment.trim(),
      location: editLocation,
      status: editStatus,
    });

    if (!res.success) {
      setEditError(res.message);
    } else {
      setEditSuccess(res.message);
      setTimeout(() => {
        setEditingUser(null);
        setEditSuccess(null);
      }, 1200);
    }
  };

  // Confirm Delete User
  const handleConfirmDeleteUser = () => {
    if (!deletingUser) return;
    setDeleteError(null);
    setDeleteSuccess(null);

    const res = deleteUser(deletingUser.id);
    if (!res.success) {
      setDeleteError(res.message);
    } else {
      setDeleteSuccess(res.message);
      setTimeout(() => {
        setDeletingUser(null);
        setDeleteSuccess(null);
      }, 1200);
    }
  };

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
      initialStatus: regStatusOption,
    });

    if (!result.success) {
      setRegError(result.message);
    } else {
      setRegSuccess(result.message);
      setRegName('');
      setRegEmail('');
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegSuccess(null);
      }, 1500);
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
          onClick={() => setActiveTab('dropdowns')}
          className={`px-4 py-3 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'dropdowns' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <ListFilter className="w-4 h-4 text-amber-400" />
          <span>Form Dropdowns Customizer</span>
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

        <button
          onClick={() => setActiveTab('moduleAccess')}
          className={`px-4 py-3 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'moduleAccess' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>Role Module Access Matrix</span>
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

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search user name or email..."
                value={searchUserQuery}
                onChange={e => setSearchUserQuery(e.target.value)}
                className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition flex items-center space-x-1.5 whitespace-nowrap shadow-lg shadow-emerald-500/20"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Approved Users (Excel)</span>
              </button>
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
                          {/* Dispatch Credentials Button */}
                          <button
                            onClick={async () => {
                              const res = await sendEmailCredentialsServer(user.email);
                              alert(res.message);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30 text-[11px] font-bold transition inline-flex items-center space-x-1"
                            title="Send login credentials & security PIN to user's corporate email via Server API"
                          >
                            <Send className="w-3 h-3" />
                            <span>Dispatch Credentials</span>
                          </button>

                          {/* Edit User Button */}
                          <button
                            onClick={() => handleOpenEditUser(user)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-bold transition inline-flex items-center space-x-1"
                            title="Edit User Profile & Role"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {/* Simulate Verify Button */}
                          {isPendingVerify && user.verificationToken && (
                            <button
                              onClick={() => verifyEmailWithToken(user.verificationToken!)}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[10px] font-bold transition"
                              title="Simulate user clicking email validation link"
                            >
                              Verify
                            </button>
                          )}

                          {/* Revoke / Suspend Access Button */}
                          {isApproved ? (
                            <button
                              onClick={() => revokeUserAccess(user.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition inline-flex items-center space-x-1"
                              title="Revoke / Suspend User Access"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Revoke</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserStatus(user.id, 'Active Approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition inline-flex items-center space-x-1"
                              title="Approve / Activate Access"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Set Active</span>
                            </button>
                          )}

                          {/* Delete User Button */}
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold transition inline-flex items-center space-x-1"
                            title="Permanently remove user from database"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
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

      {/* TAB 3: FORM DROPDOWNS CUSTOMIZER */}
      {activeTab === 'dropdowns' && (() => {
        const categoriesConfig: {
          key: DropdownCategoryKey;
          label: string;
          icon: React.ReactNode;
          description: string;
          items: string[];
          usageNote: string;
        }[] = [
          {
            key: 'roles',
            label: 'Operational Roles',
            icon: <HardHat className="w-4 h-4 text-amber-400" />,
            description: 'Corporate RBAC roles assigned to users during registration & role switching',
            items: availableRoles,
            usageNote: 'Used in AuthGate, Admin Panel, Registration & Role Switcher'
          },
          {
            key: 'departments',
            label: 'Departments',
            icon: <Building2 className="w-4 h-4 text-cyan-400" />,
            description: 'Operational & technical departments for user accounts',
            items: availableDepartments,
            usageNote: 'Used in User Registration, Access Request & Audit Logs'
          },
          {
            key: 'locations',
            label: 'Primary Locations & Yards',
            icon: <MapPin className="w-4 h-4 text-emerald-400" />,
            description: 'Supply base yards, offshore rigs, machine shops, and warehouses',
            items: availableLocations,
            usageNote: 'Used in Inventory Items, Material Transfer Tickets & Stock Filters'
          },
          {
            key: 'holeSections',
            label: 'Target Hole Sections',
            icon: <Layers className="w-4 h-4 text-purple-400" />,
            description: 'Well construction hole sizes and casing program sections',
            items: availableHoleSections,
            usageNote: 'Used in Tubular Modal, Campaign Planner & Inventory Filters'
          },
          {
            key: 'itemCategories',
            label: 'Item & Equipment Categories',
            icon: <Tag className="w-4 h-4 text-blue-400" />,
            description: 'Tubular, BHA, tool, casing, and downhole equipment classifications',
            items: availableCategories,
            usageNote: 'Used in Add/Edit Tubular Item & Excel Upload Mapper'
          },
          {
            key: 'equipmentConditions',
            label: 'Equipment Condition Grades',
            icon: <Wrench className="w-4 h-4 text-rose-400" />,
            description: 'Tubular & tool physical wear grades (e.g. Premium Class, Class 2, Scrap)',
            items: availableEquipmentConditions,
            usageNote: 'Used in QA/QC Inspection & Item Details Modal'
          },
          {
            key: 'maintenanceStatuses',
            label: 'Maintenance & Inspection Statuses',
            icon: <ShieldCheck className="w-4 h-4 text-amber-300" />,
            description: 'Operational readiness & recertification statuses',
            items: availableMaintenanceStatuses,
            usageNote: 'Used in Inventory Table Filters, Bulk Status Updates & QA/QC Log'
          },
          {
            key: 'carrierTypes',
            label: 'Transport Carrier Types',
            icon: <Truck className="w-4 h-4 text-cyan-300" />,
            description: 'Logistics vessels, heavy haulers, third-party trucks, and transport modes',
            items: availableCarrierTypes,
            usageNote: 'Used in Material Transfer Tickets (MTT) Creation & Dispatch'
          }
        ];

        const activeCat = categoriesConfig.find(c => c.key === selectedDropdownCategory) || categoriesConfig[0];

        const handleAddOptionSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          setDropdownMsg(null);
          if (!newOptionText.trim()) {
            setDropdownMsg({ type: 'error', text: 'Please enter a valid option name.' });
            return;
          }

          const res = addDropdownOption(selectedDropdownCategory, newOptionText.trim());
          if (res.success) {
            setDropdownMsg({ type: 'success', text: `Added "${newOptionText.trim()}" to ${activeCat.label}.` });
            setNewOptionText('');
          } else {
            setDropdownMsg({ type: 'error', text: res.message });
          }
        };

        const handleRemoveOptionClick = (option: string) => {
          setDropdownMsg(null);
          const res = removeDropdownOption(selectedDropdownCategory, option);
          if (res.success) {
            setDropdownMsg({ type: 'success', text: `Removed "${option}" from ${activeCat.label}.` });
          } else {
            setDropdownMsg({ type: 'error', text: res.message });
          }
        };

        const handleResetCategoryClick = () => {
          if (window.confirm(`Reset "${activeCat.label}" options to system default initial list?`)) {
            resetDropdownOptions(selectedDropdownCategory);
            setDropdownMsg({ type: 'success', text: `Reset "${activeCat.label}" to system default options.` });
          }
        };

        const handleResetAllClick = () => {
          if (window.confirm(`Reset ALL dropdown categories to system initial defaults?`)) {
            resetDropdownOptions();
            setDropdownMsg({ type: 'success', text: `All form dropdown input lists reset to system initial defaults.` });
          }
        };

        return (
          <div className="space-y-6">
            
            {/* Top Banner Notice */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5 shrink-0">
                  <ListFilter className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Dynamic Input Form Dropdown Customizer</h3>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Customize the options for operational roles, departments, locations/yards, hole sections, categories, equipment conditions, maintenance statuses, and carrier types across all input forms.
                  </p>
                </div>
              </div>

              <button
                onClick={handleResetAllClick}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-semibold flex items-center space-x-1.5 shrink-0 transition"
                title="Reset all dropdown categories to default initial lists"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset All to Initial Defaults</span>
              </button>
            </div>

            {/* Notification Banner */}
            {dropdownMsg && (
              <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                dropdownMsg.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center space-x-2">
                  {dropdownMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span className="font-medium">{dropdownMsg.text}</span>
                </div>
                <button onClick={() => setDropdownMsg(null)} className="text-gray-400 hover:text-white">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Category Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categoriesConfig.map((cat) => {
                const isSelected = selectedDropdownCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setSelectedDropdownCategory(cat.key);
                      setDropdownMsg(null);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-lg text-white'
                        : 'bg-[#111114] border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-white/5">{cat.icon}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isSelected ? 'bg-amber-500 text-black' : 'bg-white/10 text-gray-300'
                      }`}>
                        {cat.items.length} items
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-white">{cat.label}</h4>
                      <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{cat.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Category Manager Box */}
            <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
              
              {/* Category Title & Reset Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    {activeCat.icon}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-white text-base">{activeCat.label}</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                        {activeCat.items.length} Options Defined
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{activeCat.description}</p>
                    <p className="text-[11px] text-cyan-400/90 font-mono mt-1 flex items-center space-x-1">
                      <ChevronRight className="w-3 h-3 text-cyan-400" />
                      <span>{activeCat.usageNote}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleResetCategoryClick}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-semibold flex items-center space-x-1.5 shrink-0 transition"
                  title="Reset this category to default options"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset Category Defaults</span>
                </button>
              </div>

              {/* Add New Option Form */}
              <form onSubmit={handleAddOptionSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    placeholder={`Add new ${activeCat.label.toLowerCase()} option...`}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition shadow-lg flex items-center justify-center space-x-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Option</span>
                </button>
              </form>

              {/* Active Options List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Current {activeCat.label} Dropdown Options</span>
                  <span className="text-[10px] text-gray-500 font-normal">Click delete icon to remove custom or default entries</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeCat.items.map((opt, idx) => (
                    <div
                      key={opt + idx}
                      className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2 group hover:border-amber-500/30 transition"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400 shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-white truncate" title={opt}>
                          {opt}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveOptionClick(opt)}
                        disabled={activeCat.items.length <= 1}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 shrink-0"
                        title={activeCat.items.length <= 1 ? "Cannot delete sole remaining option" : `Remove "${opt}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        );
      })()}

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

      {/* TAB 4: DEDICATED FIREBASE DATABASE & EMBEDDED PERSISTENCE */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          
          {/* Dedicated Firebase Cloud Firestore Card */}
          <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white text-base">Dedicated Firebase Firestore Database</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                    Target Instance Active
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Enterprise-grade cloud persistence with strict Zero-Trust RBAC security rules and confidential access enforcement.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    setIsTestingDb(true);
                    setDbTestResult(null);
                    const res = await testDedicatedFirestoreConnection();
                    setIsTestingDb(false);
                    setDbTestResult({
                      success: res.connected,
                      message: res.message,
                      latencyMs: res.latencyMs
                    });
                  }}
                  disabled={isTestingDb}
                  className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200 text-xs font-semibold transition flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isTestingDb ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Execute complete database migration to dedicated Firestore instance? All current tubular inventory, campaigns, transfers, and user credentials will be synchronized.')) {
                      setMigrationOutput(null);
                      const res = await migrateDatabaseToDedicatedFirestore();
                      setMigrationOutput(res);
                    }
                  }}
                  disabled={isMigratingToDedicatedDb}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition flex items-center space-x-1.5 shadow-lg shadow-amber-500/20"
                >
                  {isMigratingToDedicatedDb ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{isMigratingToDedicatedDb ? 'Migrating Database...' : 'Migrate to Dedicated Firestore'}</span>
                </button>
              </div>
            </div>

            {/* Test Connection / Migration Feedback Alerts */}
            {dbTestResult && (
              <div className={`p-4 rounded-xl text-xs flex items-start space-x-3 border ${
                dbTestResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {dbTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="font-bold">Dedicated Firestore Diagnostic:</strong> {dbTestResult.message}
                  {dbTestResult.latencyMs && (
                    <span className="ml-2 font-mono text-[11px] text-emerald-400">({dbTestResult.latencyMs}ms response latency)</span>
                  )}
                </div>
              </div>
            )}

            {migrationOutput && (
              <div className={`p-4 rounded-xl text-xs flex items-start space-x-3 border ${
                migrationOutput.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {migrationOutput.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p><strong className="font-bold">Migration Outcome:</strong> {migrationOutput.message}</p>
                  {migrationOutput.details && (
                    <p className="text-[11px] font-mono text-gray-300">
                      Synchronized: {migrationOutput.details.items} items, {migrationOutput.details.users} users, {migrationOutput.details.transfers} transfers, {migrationOutput.details.campaigns} campaigns.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Database Instance Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1.5">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Database Target Identifier</span>
                <p className="font-mono text-xs text-amber-400 font-bold break-all">{dedicatedDatabaseId}</p>
                <span className="inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">
                  Dedicated Applet Instance
                </span>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1.5">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Security & Access Protocol</span>
                <p className="font-bold text-white text-xs">Zero-Trust Microsoft OAuth + RBAC</p>
                <p className="text-[11px] text-gray-400">Strict domain whitelisting & encrypted TLS in-flight/at-rest</p>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1.5">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Audit Trail Governance</span>
                <p className="font-bold text-emerald-400 text-xs">Immutable Action Logs</p>
                <p className="text-[11px] text-gray-400">Append-only audit ledger with user ID & timestamp verification</p>
              </div>
            </div>
          </div>

          {/* Embedded Local Storage & Backup Tools */}
          <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="border-b border-white/10 pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center space-x-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>Embedded Local DB Engine & Offline Sync</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  IndexedDB + LocalStorage offline-first cache with real-time BroadcastChannel multi-tab pub/sub
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Local Cache Synced</span>
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

        </div>
      )}

      {/* TAB 6: ROLE-BASED ACCESS CONTROL (RBAC) MODULE PERMISSIONS MATRIX */}
      {activeTab === 'moduleAccess' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Role-Based Access Control (RBAC) Module Permissions Engine</h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Governance Matrix
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Define explicit module access rights for each role. Each role will strictly see and navigate only to their authorized campaign modules.
              </p>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Reset all role module permissions to system default mapping?')) {
                  resetRoleModulePermissions();
                }
              }}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200 text-xs font-semibold transition flex items-center space-x-2 shrink-0"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Reset Permissions to Default</span>
            </button>
          </div>

          {/* Role Access Cards List */}
          <div className="space-y-4">
            {availableRoles.map(role => {
              const isAdminRole = role === 'System Administrator';
              const activeModules = roleModulePermissions[role] || (isAdminRole ? [
                'dashboard', 'inventory', 'drillingEngineer', 'supplyBaseMatco', 
                'rigSiteMatco', 'checkAndBalance', 'holeSection', 'surplus', 
                'movement', 'audit', 'admin'
              ] : ['dashboard', 'inventory']);

              const roleUsers = allUsers.filter(u => u.role === role);

              const allModuleList: Array<{
                key: string;
                name: string;
                category: string;
                desc: string;
              }> = [
                { key: 'dashboard', name: 'Executive Dashboard', category: 'General', desc: 'Campaign KPIs, inventory distribution, critical alerts' },
                { key: 'materialsManagement', name: 'Materials Management Hub', category: 'Logistics', desc: 'Full OCTG database CRUD, Excel/CSV bulk import/export, yard racks & batch actions' },
                { key: 'inventory', name: 'Tubulars & Tools Inventory', category: 'General', desc: 'Serial-tracked master inventory table and details' },
                { key: 'drillingEngineer', name: 'Drilling Engineer Hub', category: 'Engineering', desc: 'Design tally creation, API Spec safety factor checks' },
                { key: 'supplyBaseMatco', name: 'Supply Base Matco', category: 'Logistics', desc: 'Yard management, PO compliance verification' },
                { key: 'rigSiteMatco', name: 'Rig Site Matco', category: 'Offshore', desc: 'Deck tally, vessel unloading, RIH tally, backloads' },
                { key: 'checkAndBalance', name: 'Check & Balance Matrix', category: 'QA / QC', desc: 'Physical vs digital tally reconciliation & flags' },
                { key: 'holeSection', name: 'Hole Section Planner', category: 'Engineering', desc: 'Hole section planning (36" to 6") and allocation' },
                { key: 'surplus', name: 'Surplus & Backloads', category: 'Logistics', desc: 'Surplus booking workflow & 5-stage approvals' },
                { key: 'movement', name: 'Material Transfers', category: 'Logistics', desc: 'Manifest creation, transfer tracking & signoffs' },
                { key: 'audit', name: 'Audit Reports & Logs', category: 'Audit', desc: 'Campaign audit trail and downloadable reports' },
                { key: 'admin', name: 'Admin & Access Control', category: 'Governance', desc: 'User management, domain whitelist, RBAC matrix' },
              ];

              const toggleModule = (modKey: string) => {
                if (isAdminRole && modKey === 'admin') return;
                let updated: string[];
                if (activeModules.includes(modKey)) {
                  updated = activeModules.filter(m => m !== modKey);
                } else {
                  updated = [...activeModules, modKey];
                }
                updateRoleModulePermissions(role, updated);
              };

              const grantAll = () => {
                const allKeys = allModuleList.map(m => m.key);
                updateRoleModulePermissions(role, allKeys);
              };

              const grantCoreOnly = () => {
                updateRoleModulePermissions(role, ['dashboard', 'inventory']);
              };

              const clearAll = () => {
                if (isAdminRole) {
                  updateRoleModulePermissions(role, ['admin']);
                } else {
                  updateRoleModulePermissions(role, []);
                }
              };

              return (
                <div 
                  key={role} 
                  className={`bg-[#111114] border rounded-2xl p-5 shadow-lg space-y-4 transition ${
                    isAdminRole ? 'border-amber-500/30' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl ${isAdminRole ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-gray-300'}`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-white text-sm">{role}</h3>
                          {isAdminRole && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                              System Governance Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {roleUsers.length} user{roleUsers.length === 1 ? '' : 's'} assigned • {activeModules.length} of {allModuleList.length} modules accessible
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px]">
                      <button
                        onClick={grantAll}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 font-semibold transition"
                      >
                        Grant All
                      </button>
                      <button
                        onClick={grantCoreOnly}
                        className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 font-semibold transition"
                      >
                        Core Only
                      </button>
                      <button
                        onClick={clearAll}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 font-semibold transition"
                      >
                        Clear Non-Core
                      </button>
                    </div>
                  </div>

                  {/* Modules Checkbox Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {allModuleList.map((mod) => {
                      const isChecked = activeModules.includes(mod.key);
                      const isLockedAdmin = isAdminRole && mod.key === 'admin';

                      return (
                        <label
                          key={mod.key}
                          onClick={() => !isLockedAdmin && toggleModule(mod.key)}
                          className={`p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-amber-500/10 border-amber-500/40 text-white'
                              : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                          } ${isLockedAdmin ? 'opacity-80 cursor-not-allowed' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isLockedAdmin}
                            onChange={() => {}}
                            className="mt-0.5 rounded border-white/20 bg-black text-amber-500 focus:ring-amber-500 h-4 w-4 shrink-0"
                          />
                          <div className="space-y-0.5 overflow-hidden">
                            <div className="flex items-center space-x-1.5">
                              <span className={`text-xs font-bold truncate ${isChecked ? 'text-amber-300' : 'text-gray-300'}`}>
                                {mod.name}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 line-clamp-1">
                              {mod.desc}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
                    {availableRoles.map(role => (
                      <option key={role} value={role} className="bg-[#141417]">{role}</option>
                    ))}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Primary Location</label>
                  <select
                    value={regLocation}
                    onChange={e => setRegLocation(e.target.value as LocationType)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    {availableLocations.map(loc => (
                      <option key={loc} value={loc} className="bg-[#141417]">{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Activation Strategy</label>
                  <select
                    value={regStatusOption}
                    onChange={e => setRegStatusOption(e.target.value as UserAccountStatus)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Active Approved" className="bg-[#141417]">Instant Active Approved</option>
                    <option value="Pending Email Verification" className="bg-[#141417]">Send Email Verification Token</option>
                    <option value="Pending Admin Approval" className="bg-[#141417]">Pending Admin Approval</option>
                  </select>
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
                  Register User
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-xs text-gray-200">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center space-x-2">
                <Pencil className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Edit User Profile & Account Settings</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{editSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Full User Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Corporate Email Address *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Assigned Role</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as UserRole)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    {availableRoles.map(role => (
                      <option key={role} value={role} className="bg-[#141417]">{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={e => setEditDepartment(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Primary Location</label>
                  <select
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value as LocationType)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    {availableLocations.map(loc => (
                      <option key={loc} value={loc} className="bg-[#141417]">{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as UserAccountStatus)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Active Approved" className="bg-[#141417]">Active Approved</option>
                    <option value="Pending Admin Approval" className="bg-[#141417]">Pending Admin Approval</option>
                    <option value="Pending Email Verification" className="bg-[#141417]">Pending Email Verification</option>
                    <option value="Suspended" className="bg-[#141417]">Suspended</option>
                    <option value="Deactivated" className="bg-[#141417]">Deactivated</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111114] border border-rose-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs text-gray-200">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-rose-500/10">
              <div className="flex items-center space-x-2 text-rose-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Confirm Permanent Deletion</h3>
              </div>
              <button onClick={() => setDeletingUser(null)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {deleteError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{deleteError}</span>
                </div>
              )}

              {deleteSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{deleteSuccess}</span>
                </div>
              )}

              <p className="text-gray-300">
                Are you sure you want to permanently remove <strong className="text-white">{deletingUser.name}</strong> (<span className="text-amber-300 font-mono">{deletingUser.email}</span>) from the database?
              </p>
              
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-[11px]">
                ⚠️ This will purge their record from IndexedDB, LocalStorage, and Cloud Firestore. This action cannot be reversed.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteUser}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Permanently Delete User</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Bulk Upload Modal */}
      <ApprovedUsersUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

    </div>
  );
};
