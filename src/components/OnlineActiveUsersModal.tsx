import React, { useState, useMemo } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { OnlineUserPresence, UserRole, LocationType } from '../types/drilling';
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  Shield, 
  MapPin, 
  Clock, 
  Laptop, 
  Smartphone, 
  Radio, 
  Activity, 
  Anchor, 
  Building2, 
  Layers, 
  LogOut, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  ExternalLink,
  Flame,
  HardHat,
  Compass
} from 'lucide-react';

interface OnlineActiveUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const OnlineActiveUsersModal: React.FC<OnlineActiveUsersModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const { 
    currentUser, 
    onlineUsers, 
    onlineUserCount, 
    refreshOnlinePresence, 
    terminateUserSession,
    availableLocations,
    availableRoles
  } = useDrilling();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = currentUser?.role === 'System Administrator';

  // Filtered online users list
  const filteredUsers = useMemo(() => {
    return onlineUsers.filter(user => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          user.userName.toLowerCase().includes(q) ||
          user.userEmail.toLowerCase().includes(q) ||
          user.userRole.toLowerCase().includes(q) ||
          user.department.toLowerCase().includes(q) ||
          user.location.toLowerCase().includes(q) ||
          user.currentModule.toLowerCase().includes(q) ||
          (user.activeCampaignCode && user.activeCampaignCode.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Location filter
      if (selectedLocationFilter !== 'ALL' && user.location !== selectedLocationFilter) {
        return false;
      }

      // Role filter
      if (selectedRoleFilter !== 'ALL' && user.userRole !== selectedRoleFilter) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL' && user.status !== selectedStatusFilter) {
        return false;
      }

      return true;
    });
  }, [onlineUsers, searchQuery, selectedLocationFilter, selectedRoleFilter, selectedStatusFilter]);

  // Key KPI metrics
  const stats = useMemo(() => {
    const total = onlineUsers.length;
    const rigUsers = onlineUsers.filter(u => u.location.toLowerCase().includes('rig')).length;
    const supplyBaseUsers = onlineUsers.filter(u => u.location.toLowerCase().includes('base') || u.location.toLowerCase().includes('yard')).length;
    const engineeringUsers = onlineUsers.filter(u => u.userRole.toLowerCase().includes('engineer') || u.userRole.toLowerCase().includes('admin') || u.userRole.toLowerCase().includes('cost')).length;

    return { total, rigUsers, supplyBaseUsers, engineeringUsers };
  }, [onlineUsers]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refreshOnlinePresence();
    setTimeout(() => {
      setIsRefreshing(false);
      setActionMessage({ type: 'success', text: 'Live presence directory refreshed successfully.' });
      setTimeout(() => setActionMessage(null), 3000);
    }, 600);
  };

  const handleTerminateSession = async (session: OnlineUserPresence) => {
    const confirmMsg = session.isCurrentUser
      ? `Are you sure you want to disconnect your own session? You will be logged out.`
      : `Are you sure you want to terminate the active session for ${session.userName} (${session.userRole})?`;

    if (window.confirm(confirmMsg)) {
      setTerminatingSessionId(session.sessionId);
      const res = await terminateUserSession(session.sessionId);
      setTerminatingSessionId(null);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
      } else {
        setActionMessage({ type: 'error', text: res.message });
      }
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleCopyDirectoryReport = () => {
    const textReport = `--- DRILLCORE ENTERPRISE ACTIVE PERSONNEL DIRECTORY ---
Generated: ${new Date().toLocaleString()}
Active Total: ${stats.total} sessions

${onlineUsers.map((u, i) => `${i + 1}. ${u.userName} (${u.userRole})
   Email: ${u.userEmail} | Location: ${u.location}
   Module: ${u.currentModule} | Status: ${u.status} | Connected: ${Math.round((Date.now() - u.loginTime) / 60000)}m ago`).join('\n\n')}`;

    navigator.clipboard.writeText(textReport);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const formatDuration = (epochMs: number) => {
    if (!epochMs) return 'Just now';
    const mins = Math.max(1, Math.round((Date.now() - epochMs) / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m ago`;
  };

  const formatHeartbeat = (heartbeatMs: number) => {
    if (!heartbeatMs) return 'Live';
    const secs = Math.max(0, Math.round((Date.now() - heartbeatMs) / 1000));
    if (secs < 10) return 'Just now (Active)';
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.round(secs / 60);
    return `${mins}m ago`;
  };

  const getRoleBadgeStyle = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return 'bg-purple-950/70 text-purple-300 border-purple-800';
    if (r.includes('engineer')) return 'bg-cyan-950/70 text-cyan-300 border-cyan-800';
    if (r.includes('material')) return 'bg-emerald-950/70 text-emerald-300 border-emerald-800';
    if (r.includes('toolpusher') || r.includes('rig')) return 'bg-amber-950/70 text-amber-300 border-amber-800';
    if (r.includes('inspector') || r.includes('qa')) return 'bg-blue-950/70 text-blue-300 border-blue-800';
    if (r.includes('cost') || r.includes('finance')) return 'bg-yellow-950/70 text-yellow-300 border-yellow-800';
    if (r.includes('logistics')) return 'bg-indigo-950/70 text-indigo-300 border-indigo-800';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const getLocationIcon = (loc: string) => {
    const l = loc.toLowerCase();
    if (l.includes('rig')) return <Anchor className="w-3.5 h-3.5 text-amber-400" />;
    if (l.includes('base') || l.includes('yard')) return <Building2 className="w-3.5 h-3.5 text-emerald-400" />;
    if (l.includes('shop') || l.includes('test') || l.includes('lab')) return <Activity className="w-3.5 h-3.5 text-blue-400" />;
    return <MapPin className="w-3.5 h-3.5 text-slate-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/70">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-white tracking-tight">Active Online Personnel & Rig Presence</h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {onlineUserCount} Live Sessions
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time operational presence monitoring across Offshore Rigs, Supply Bases, and Engineering HQ.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Refresh online user heartbeats"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionMessage && (
          <div className={`px-5 py-2.5 text-xs font-medium flex items-center gap-2 ${
            actionMessage.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800' : 'bg-red-950/80 text-red-300 border-b border-red-800'
          }`}>
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 border-b border-slate-800">
          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Active</p>
              <p className="text-xl font-bold text-white">{stats.total} <span className="text-xs font-normal text-slate-400">Users</span></p>
            </div>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Offshore Rigs</p>
              <p className="text-xl font-bold text-amber-300">{stats.rigUsers} <span className="text-xs font-normal text-slate-400">Connected</span></p>
            </div>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Base & Yards</p>
              <p className="text-xl font-bold text-cyan-300">{stats.supplyBaseUsers} <span className="text-xs font-normal text-slate-400">Active</span></p>
            </div>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">HQ & Engineering</p>
              <p className="text-xl font-bold text-purple-300">{stats.engineeringUsers} <span className="text-xs font-normal text-slate-400">Online</span></p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, role, rig, or module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Location Filter */}
            <select
              value={selectedLocationFilter}
              onChange={(e) => setSelectedLocationFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Locations ({onlineUsers.length})</option>
              {availableLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Roles</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ONLINE">🟢 Online Active (&lt;45s)</option>
              <option value="AWAY">🟡 Away / Idle (1-3m)</option>
            </select>
          </div>
        </div>

        {/* Online Users List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-800/40">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-base font-semibold text-slate-300">No matching online personnel found</p>
              <p className="text-xs text-slate-500 mt-1">Try broadening your search query or reset location/role filters.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLocationFilter('ALL');
                  setSelectedRoleFilter('ALL');
                  setSelectedStatusFilter('ALL');
                }}
                className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg border border-slate-700"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelf = user.isCurrentUser || (currentUser && user.userId === currentUser.id);
              const isOnline = user.status === 'ONLINE';

              return (
                <div 
                  key={user.id || user.sessionId}
                  className={`p-4 rounded-xl transition-all duration-200 border ${
                    isSelf 
                      ? 'bg-slate-950/80 border-emerald-500/40 shadow-sm shadow-emerald-950/20' 
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Left: Avatar, Name, Role, Location */}
                    <div className="flex items-start sm:items-center gap-3.5">
                      {/* Avatar with Status Indicator */}
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-200">
                          {user.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span 
                          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                            isOnline ? 'bg-emerald-400 ring-2 ring-emerald-950' : 'bg-amber-400'
                          }`}
                          title={isOnline ? 'Active Online' : 'Away / Idle'}
                        />
                      </div>

                      {/* Info block */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-white">{user.userName}</span>
                          {isSelf && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                              YOU (CURRENT SESSION)
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-[10px] font-medium border rounded-md ${getRoleBadgeStyle(user.userRole)}`}>
                            {user.userRole}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                          <span className="text-slate-400 font-mono text-[11px]">{user.userEmail}</span>
                          <span className="text-slate-600">•</span>
                          <span className="flex items-center gap-1 text-slate-300">
                            {getLocationIcon(user.location)}
                            <span>{user.location}</span>
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">{user.department}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Active Activity & Heartbeat & Action */}
                    <div className="flex flex-col sm:items-end gap-1.5 pl-14 sm:pl-0">
                      {/* Current Activity / Module */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-200">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-400">Task:</span>
                        <span className="font-medium text-emerald-300">{user.currentModule || 'Dashboard Overview'}</span>
                      </div>

                      {/* Heartbeat and Session Time */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Conn: {formatDuration(user.loginTime)}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Radio className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-400/90">Heartbeat: {formatHeartbeat(user.lastHeartbeat)}</span>
                        </span>
                        
                        {/* Terminate Session Button (for Admins or Self) */}
                        {(isAdmin || isSelf) && (
                          <>
                            <span>•</span>
                            <button
                              onClick={() => handleTerminateSession(user)}
                              disabled={terminatingSessionId === user.sessionId}
                              className="text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 text-[11px] font-medium"
                              title={isSelf ? 'Logout this session' : 'Disconnect this user'}
                            >
                              <LogOut className="w-3 h-3" />
                              <span>{isSelf ? 'Sign Out' : 'Terminate'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Device / Client metadata footer */}
                  {user.deviceInfo && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pl-14 sm:pl-0">
                      <div className="flex items-center gap-2">
                        <Laptop className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-400">{user.deviceInfo.browser || 'Corporate Web Client'}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-400">{user.deviceInfo.platform || 'Workstation'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3 text-emerald-400/70" />
                        <span className="text-slate-400 font-mono text-[10px]">{user.deviceInfo.ip || 'SSL Intranet Encrypted'}</span>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Presence auto-syncs every 10s via Firestore & Enterprise Presence Bus</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyDirectoryReport}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              {copiedNotification ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Report Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Directory</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors text-xs"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
