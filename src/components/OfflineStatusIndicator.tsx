import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  CloudUpload, 
  Layers, 
  Clock, 
  X, 
  ChevronRight, 
  HardDrive,
  Info,
  Trash2
} from 'lucide-react';

export const OfflineStatusIndicator: React.FC = () => {
  const { 
    isOffline, 
    toggleOfflineMode, 
    offlineQueue, 
    processSyncQueue, 
    clearOfflineQueue,
    syncStatus, 
    syncProgress, 
    lastSyncedAt 
  } = useDrilling();

  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const formatLastSync = (isoString: string | null) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSecs < 10) return 'Just now';
      if (diffSecs < 60) return `${diffSecs}s ago`;
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const isSyncing = syncStatus === 'syncing';
  const hasQueue = offlineQueue.length > 0;

  return (
    <>
      {/* Top Persistent Offline & Sync Status Banner */}
      <div 
        id="offline-status-indicator-bar"
        className={`w-full transition-all duration-300 z-40 border-b select-none ${
          isOffline 
            ? 'bg-amber-950/40 border-amber-500/30 text-amber-200' 
            : isSyncing 
              ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
              : syncStatus === 'synced'
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                : 'bg-[#121216]/90 border-white/5 text-gray-400'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            
            {/* Left: Core Status Label & Pulse Beacon */}
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              {isOffline ? (
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                  <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold tracking-wide text-[11px] uppercase">
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Offline Field Mode</span>
                  </div>
                </div>
              ) : isSyncing ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="font-semibold text-cyan-300">Synchronizing to Central Cloud...</span>
                </div>
              ) : syncStatus === 'synced' ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium text-emerald-300">Cloud Synchronized</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span className="text-gray-300 font-medium">Cloud Connected</span>
                </div>
              )}

              {/* Informative Micro-Description */}
              <span className="hidden md:inline text-[11px] text-gray-300/80">
                {isOffline 
                  ? 'All changes are safely recorded to local storage and will push to cloud once reconnected.'
                  : isSyncing
                    ? `Processing ${syncProgress.processed} of ${syncProgress.total} queue items (${syncProgress.percent}%)`
                    : `Last cloud sync: ${formatLastSync(lastSyncedAt)}`}
              </span>
            </div>

            {/* Middle: Progress Bar for active syncing */}
            {isSyncing && (
              <div className="flex-1 max-w-xs mx-2 hidden sm:block">
                <div className="flex items-center justify-between text-[10px] text-cyan-300/90 mb-1">
                  <span className="truncate max-w-[180px]">{syncProgress.currentItem || 'Synchronizing items...'}</span>
                  <span className="font-mono font-bold">{syncProgress.percent}%</span>
                </div>
                <div className="w-full bg-cyan-950/60 rounded-full h-1.5 overflow-hidden border border-cyan-500/20">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out shadow-sm"
                    style={{ width: `${Math.max(5, syncProgress.percent)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Right: Actions, Queue Count & Mode Switcher */}
            <div className="flex items-center space-x-2 shrink-0">
              
              {/* Queue Items Badge & View Button */}
              {hasQueue && (
                <button
                  id="view-offline-queue-btn"
                  onClick={() => setIsQueueModalOpen(true)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-medium transition cursor-pointer"
                  title="Click to inspect local changes waiting to sync"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold">{offlineQueue.length}</span>
                  <span className="hidden sm:inline">pending sync</span>
                </button>
              )}

              {/* Sync Now Button (Active if queue exists or offline) */}
              {(hasQueue || isOffline) && (
                <button
                  id="sync-now-trigger-btn"
                  onClick={() => processSyncQueue()}
                  disabled={isSyncing}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shadow-sm ${
                    isSyncing 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold shadow-amber-500/10 cursor-pointer'
                  }`}
                  title="Trigger immediate sync with DrillSpec Cloud"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
                </button>
              )}

              {/* Offline Field Mode Toggle Simulation Button */}
              <button
                id="toggle-offline-mode-btn"
                onClick={toggleOfflineMode}
                className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                  isOffline
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
                title={isOffline ? 'Switch to Online mode' : 'Simulate / Force Offline Field Mode (e.g. for rig testing)'}
              >
                {isOffline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Go Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-gray-400" />
                    <span className="hidden sm:inline">Field Mode</span>
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      </div>

      {/* Offline Queue Inspector Modal */}
      {isQueueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121216] border border-white/10 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#16161c]">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Offline Sync Queue</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {offlineQueue.length} Action{offlineQueue.length === 1 ? '' : 's'}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">Local changes queued on device ready to commit to cloud database</p>
                </div>
              </div>
              <button
                onClick={() => setIsQueueModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Queue List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {offlineQueue.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
                  <h4 className="text-sm font-semibold text-white">Sync Queue is Empty</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    All local edits, transfer tickets, and inspection logs are in sync with DrillSpec Cloud.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-1 text-xs text-gray-400">
                    <span>Pending Local Operations</span>
                    <span className="text-[11px] text-amber-400/90 font-mono">FIFO Queue</span>
                  </div>

                  <div className="space-y-2">
                    {offlineQueue.map((item, idx) => (
                      <div 
                        key={item.id}
                        className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start space-x-3">
                          <span className="font-mono text-xs px-2 py-1 rounded-md bg-white/10 text-amber-400 font-bold shrink-0">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-200">{item.actionType.replace(/_/g, ' ')}</span>
                              <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-gray-500" />
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 mt-1 font-mono bg-black/30 px-2 py-1 rounded border border-white/5">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            Pending Sync
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-[#16161c] flex items-center justify-between gap-3">
              {offlineQueue.length > 0 ? (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear the pending offline queue? Local changes will not be uploaded.')) {
                      clearOfflineQueue();
                    }
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Discard Queue</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsQueueModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:bg-white/5 border border-white/10 transition"
                >
                  Close
                </button>

                {offlineQueue.length > 0 && (
                  <button
                    onClick={async () => {
                      await processSyncQueue();
                      setIsQueueModalOpen(false);
                    }}
                    disabled={isSyncing}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition shadow-md shadow-amber-500/10"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>{isSyncing ? 'Syncing Now...' : 'Sync All to Cloud'}</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
