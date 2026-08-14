import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useDrilling } from '../context/DrillingContext';
import { UserRole, LocationType } from '../types/drilling';
import { X, Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Copy, KeyRound, UserCheck, Sparkles } from 'lucide-react';

interface ApprovedUsersUploadModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

interface ParsedUserRow {
  name: string;
  email: string;
  role: UserRole;
  department: string;
  location: LocationType;
}

export const ApprovedUsersUploadModal: React.FC<ApprovedUsersUploadModalProps> = ({ isOpen = true, onClose }) => {
  if (!isOpen) return null;
  const { bulkImportApprovedUsers, availableRoles, availableDepartments, availableLocations } = useDrilling();

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedUsers, setParsedUsers] = useState<ParsedUserRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Results State
  const [importedResults, setImportedResults] = useState<{ email: string; name: string; token: string; role: string }[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        'Full Name': 'Ahmad Razak',
        'Corporate Email': 'ahmad.razak@apexdrilling.com',
        'Role': 'Drilling Engineer',
        'Department': 'Drilling & Wells Engineering',
        'Location': 'Main Supply Base Yard',
      },
      {
        'Full Name': 'Elena Rostova',
        'Corporate Email': 'e.rostova@apexdrilling.com',
        'Role': 'Materials Coordinator (Supply Base)',
        'Department': 'Materials & Base Yard Operations',
        'Location': 'Main Supply Base Yard',
      },
      {
        'Full Name': 'Marcus Vance',
        'Corporate Email': 'm.vance@apexdrilling.com',
        'Role': 'Rig Toolpusher / Materials Specialist',
        'Department': 'Rig Site Operations',
        'Location': 'Offshore Rig Alpha',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Approved Users');
    
    // Set auto column widths
    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 32 },
      { wch: 30 },
      { wch: 30 },
      { wch: 25 },
    ];

    XLSX.writeFile(workbook, 'Drillspec_Approved_Users_Template.xlsx');
  };

  // Parse Uploaded File
  const handleFileProcess = (file: File) => {
    setErrorMsg(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          setErrorMsg('The selected spreadsheet contains no data rows.');
          return;
        }

        const validRows: ParsedUserRow[] = [];

        rawRows.forEach((row) => {
          const name = String(row['Full Name'] || row['Name'] || row['User Name'] || row['User'] || '').trim();
          const email = String(row['Corporate Email'] || row['Email'] || row['User Email'] || '').trim().toLowerCase();
          
          if (!name || !email || !email.includes('@')) {
            return; // Skip invalid row
          }

          let roleRaw = String(row['Role'] || row['User Role'] || '').trim();
          let deptRaw = String(row['Department'] || row['Dept'] || '').trim();
          let locRaw = String(row['Location'] || row['Yard'] || '').trim();

          const matchedRole = availableRoles.find(r => r.toLowerCase() === roleRaw.toLowerCase()) || 'Drilling Engineer';
          const matchedDept = availableDepartments.find(d => d.toLowerCase() === deptRaw.toLowerCase()) || 'Drilling Operations';
          const matchedLoc = availableLocations.find(l => l.toLowerCase() === locRaw.toLowerCase()) || 'Main Supply Base Yard';

          validRows.push({
            name,
            email,
            role: matchedRole as UserRole,
            department: matchedDept,
            location: matchedLoc as LocationType,
          });
        });

        if (validRows.length === 0) {
          setErrorMsg('No valid user records found. Please ensure your file includes "Full Name" and "Corporate Email" columns.');
          return;
        }

        setParsedUsers(validRows);
      } catch (err) {
        console.error('File parse error:', err);
        setErrorMsg('Error reading file. Please ensure it is a valid Excel (.xlsx/.xls) or CSV file.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Drag & Drop Handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Submit Bulk Import
  const handleImportSubmit = () => {
    if (parsedUsers.length === 0) return;
    const res = bulkImportApprovedUsers(parsedUsers);
    if (res.success) {
      setImportedResults(res.importedUsers);
    } else {
      setErrorMsg(res.errors[0] || 'Bulk import failed.');
    }
  };

  // Copy Single Token
  const handleCopyToken = (token: string, index: number) => {
    navigator.clipboard.writeText(token);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Copy All Summary
  const handleCopyAll = () => {
    if (!importedResults) return;
    const text = importedResults.map(u => `${u.name} (${u.email}) -> Token: ${u.token} [${u.role}]`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Upload Approved Corporate Users List</h2>
              <p className="text-xs text-gray-400">Import approved user records from Excel/CSV & auto-generate 6-digit login tokens</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!importedResults ? (
            <>
              {/* Template Download Option */}
              <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download Standard Approved Users Template</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Includes columns for Full Name, Corporate Email, Role, Department, and Location
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                  isDragOver
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-950/50'
                }`}
              >
                <input
                  type="file"
                  id="excel-user-file-input"
                  className="hidden"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleInputChange}
                />
                <label htmlFor="excel-user-file-input" className="cursor-pointer space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {fileName ? `Loaded file: ${fileName}` : 'Drag & drop Excel or CSV file here'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supports `.xlsx`, `.xls`, `.csv` formats
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => document.getElementById('excel-user-file-input')?.click()}
                    className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold border border-gray-700 transition inline-block"
                  >
                    Browse Local Files
                  </button>
                </label>
              </div>

              {/* Parsed Preview Table */}
              {parsedUsers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                    <span className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <span>Ready to Import ({parsedUsers.length} Approved Users)</span>
                    </span>
                  </div>

                  <div className="rounded-xl border border-gray-800 bg-gray-950/80 overflow-hidden max-h-52 overflow-y-auto">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-gray-900/90 text-gray-400 sticky top-0 uppercase text-[10px] tracking-wider border-b border-gray-800">
                        <tr>
                          <th className="p-3">Full Name</th>
                          <th className="p-3">Corporate Email</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50">
                        {parsedUsers.map((u, idx) => (
                          <tr key={idx} className="hover:bg-gray-900/50">
                            <td className="p-3 font-medium text-white">{u.name}</td>
                            <td className="p-3 font-mono text-amber-300">{u.email}</td>
                            <td className="p-3 text-gray-400">{u.role}</td>
                            <td className="p-3 text-gray-400">{u.location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Import Success Summary Screen */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-bold">Successfully Provisioned {importedResults.length} Approved Users!</p>
                    <p className="text-[11px] text-emerald-300/80">
                      Each user has been assigned a unique 6-digit authorization token. Share these tokens with the users so they can set their passwords.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCopyAll}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedAll ? 'Copied All!' : 'Copy Summary List'}</span>
                </button>
              </div>

              {/* Generated Tokens List */}
              <div className="rounded-xl border border-gray-800 bg-gray-950/90 overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-gray-900 text-gray-400 sticky top-0 uppercase text-[10px] tracking-wider border-b border-gray-800">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Generated Token</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {importedResults.map((usr, idx) => (
                      <tr key={idx} className="hover:bg-gray-900/50">
                        <td className="p-3 font-semibold text-white">{usr.name}</td>
                        <td className="p-3 font-mono text-gray-400">{usr.email}</td>
                        <td className="p-3">
                          <span className="font-mono text-amber-400 font-extrabold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs tracking-wider">
                            {usr.token}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleCopyToken(usr.token, idx)}
                            className="px-2.5 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[11px] font-semibold transition inline-flex items-center space-x-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedIndex === idx ? 'Copied' : 'Copy Token'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-800 bg-gray-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition"
          >
            {importedResults ? 'Close' : 'Cancel'}
          </button>

          {!importedResults && (
            <button
              type="button"
              disabled={parsedUsers.length === 0}
              onClick={handleImportSubmit}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                parsedUsers.length > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Import & Generate Tokens ({parsedUsers.length})</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
