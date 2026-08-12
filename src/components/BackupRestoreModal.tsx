import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { DatabaseBackupRecord } from '../types/drilling';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Calendar, 
  HardDrive, 
  CheckCircle2, 
  X, 
  Clock, 
  ShieldCheck, 
  FileText, 
  AlertTriangle,
  Sparkles,
  Layers
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose }) => {
  const { 
    backups, 
    createBackupVaultSnapshot, 
    downloadBackupFile, 
    restoreFromBackupSnapshot,
    items,
    transfers,
    allUsers,
    rigBackloads,
    campaigns,
    auditTrailLogs
  } = useDrilling();

  const [notes, setNotes] = useState('');
  const [restoringBackup, setRestoringBackup] = useState<DatabaseBackupRecord | null>(null);
  const [uploadedBackupData, setUploadedBackupData] = useState<any | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const [restoreErrorMsg, setRestoreErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateManualBackup = () => {
    const newBkp = createBackupVaultSnapshot('Manual On-Demand Backup', notes || 'Manual user-triggered database vault snapshot');
    setNotes('');
    setRestoreSuccessMsg(`Successfully generated backup point ${newBkp.id}!`);
    setTimeout(() => setRestoreSuccessMsg(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          setUploadedBackupData(parsed);
        } else {
          setRestoreErrorMsg('Invalid backup file format.');
        }
      } catch (err) {
        setRestoreErrorMsg('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const executeRestore = (dataToRestore: any) => {
    try {
      restoreFromBackupSnapshot(dataToRestore);
      setRestoringBackup(null);
      setUploadedBackupData(null);
      setRestoreSuccessMsg('Database successfully restored! All items, transfers, users, and campaigns re-hydrated.');
      setTimeout(() => setRestoreSuccessMsg(null), 5000);
    } catch (err: any) {
      setRestoreErrorMsg(`Restore Failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#121319] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#181a22] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Automated & Scheduled Backup & Vault Recovery
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  24-Hour Auto Backup Sync Active
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Perform daily/weekly/monthly local snapshots, export encrypted JSON, and perform zero-downtime database restores
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banners */}
        {restoreSuccessMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {restoreSuccessMsg}
          </div>
        )}

        {restoreErrorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            {restoreErrorMsg}
          </div>
        )}

        {/* Body Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* Current Live DB Snapshot Metrics */}
          <div className="p-5 bg-[#181a22] border border-white/10 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-400" />
              Live Database Active Snapshot Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
              <div className="p-2.5 bg-[#121319] border border-white/5 rounded-xl">
                <span className="text-lg font-extrabold text-white">{items.length}</span>
                <p className="text-[10px] text-gray-400">Tubular Items</p>
              </div>
              <div className="p-2.5 bg-[#121319] border border-white/5 rounded-xl">
                <span className="text-lg font-extrabold text-amber-400">{transfers.length}</span>
                <p className="text-[10px] text-gray-400">Transfer Tickets</p>
              </div>
              <div className="p-2.5 bg-[#121319] border border-white/5 rounded-xl">
                <span className="text-lg font-extrabold text-blue-400">{rigBackloads.length}</span>
                <p className="text-[10px] text-gray-400">Rig Backloads</p>
              </div>
              <div className="p-2.5 bg-[#121319] border border-white/5 rounded-xl">
                <span className="text-lg font-extrabold text-purple-400">{campaigns.length}</span>
                <p className="text-[10px] text-gray-400">Campaigns</p>
              </div>
              <div className="p-2.5 bg-[#121319] border border-white/5 rounded-xl">
                <span className="text-lg font-extrabold text-emerald-400">{allUsers.length}</span>
                <p className="text-[10px] text-gray-400">User Profiles</p>
              </div>
              <div className="p-2.5 bg-[#121319] border border-white/5 rounded-xl">
                <span className="text-lg font-extrabold text-gray-300">{auditTrailLogs.length}</span>
                <p className="text-[10px] text-gray-400">Audit Logs</p>
              </div>
            </div>
          </div>

          {/* Quick Actions: Create Backup / Export */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Create On-Demand Vault Backup */}
            <div className="p-5 bg-[#181a22] border border-white/10 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                Trigger On-Demand Vault Backup
              </h4>
              <p className="text-xs text-gray-400">Creates a local vault snapshot point stored safely in browser storage.</p>
              <input
                type="text"
                placeholder="Optional backup note e.g. Pre-campaign audit snapshot"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={handleCreateManualBackup}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
              >
                <Database className="w-4 h-4" />
                Create Instant Backup Snapshot
              </button>
            </div>

            {/* Export & Restore from File */}
            <div className="p-5 bg-[#181a22] border border-white/10 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                Download / Upload Backup File
              </h4>
              <p className="text-xs text-gray-400">Export database to `.drillspec.json` file or upload a backup file to restore.</p>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadBackupFile()}
                  className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-semibold text-xs border border-emerald-500/30 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Download Backup File
                </button>

                <label className="flex-1 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-semibold text-xs border border-blue-500/30 rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5">
                  <Upload className="w-4 h-4" />
                  Upload Backup File
                  <input type="file" accept=".json,.drillspec" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Uploaded File Preview Modal Trigger */}
          {uploadedBackupData && (
            <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Uploaded Backup File Detected
              </h4>
              <p className="text-xs text-gray-300">
                Found {uploadedBackupData.items?.length || 0} items, {uploadedBackupData.transfers?.length || 0} transfers, and {uploadedBackupData.campaigns?.length || 0} campaigns in uploaded file.
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => setUploadedBackupData(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeRestore(uploadedBackupData)}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Confirm System Restore From File
                </button>
              </div>
            </div>
          )}

          {/* Local Vault Historical Backup Points List */}
          <div className="bg-[#181a22] p-5 rounded-2xl border border-white/10 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Local Backup Storage Vault Points ({backups.length})
              </span>
            </h4>

            {backups.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                No backup points recorded yet. The system automatically creates daily background backups. You can also trigger a manual snapshot above.
              </p>
            ) : (
              <div className="space-y-3">
                {backups.map(bkp => (
                  <div key={bkp.id} className="p-4 bg-[#121319] border border-white/10 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">{bkp.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-gray-300 border border-white/10 font-semibold">
                          {bkp.backupType}
                        </span>
                      </div>
                      <p className="text-gray-300 mt-1">{bkp.notes}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Created by {bkp.createdByName} ({bkp.createdByRole}) on {bkp.timestamp.slice(0, 19).replace('T', ' ')}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-gray-400">
                        <span>Items: <strong className="text-white">{bkp.summary.itemsCount}</strong></span>
                        <span>• Transfers: <strong className="text-amber-400">{bkp.summary.transfersCount}</strong></span>
                        <span>• Backloads: <strong className="text-blue-400">{bkp.summary.backloadsCount}</strong></span>
                        <span>• Campaigns: <strong className="text-purple-400">{bkp.summary.campaignsCount}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => downloadBackupFile(bkp.id)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-xl border border-white/10 flex items-center gap-1"
                        title="Download JSON file for this point"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export File
                      </button>
                      <button
                        onClick={() => {
                          if (bkp.dataJson) {
                            try {
                              const parsed = JSON.parse(bkp.dataJson);
                              executeRestore(parsed);
                            } catch {
                              setRestoreErrorMsg('Failed to parse stored snapshot JSON.');
                            }
                          }
                        }}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold text-xs rounded-xl border border-amber-500/30 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore This Point
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
