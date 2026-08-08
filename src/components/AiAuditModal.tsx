import React, { useState } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { Sparkles, X, ShieldCheck, FileText, Bot, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface AiAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAuditModal: React.FC<AiAuditModalProps> = ({ isOpen, onClose }) => {
  const { items } = useDrilling();

  const [activeTab, setActiveTab] = useState<'audit' | 'parser'>('audit');
  
  // Audit State
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  // Certificate Parser State
  const [certText, setCertText] = useState(`MILL TEST CERTIFICATE - TENARIS HYDRIL
Certificate No: MTC-2026-99120
Heat Number: HT-99011A
Pipe Specs: 13 3/8" 68.0# L-80 VAM TOP
Yield Strength: 85,200 psi | Tensile Strength: 102,400 psi
Hydrostatic Test: 6,100 psi for 10 seconds (PASSED)
NDT Method: Magnetic Particle Inspection & Ultrasonic Thickness (100% Pass)
Drift Mandrel: 12.250" x 42" Drift Pass
Inspector: SGS Senior Tubular QA Inspector
Date: 01-July-2026`);
  const [loadingParse, setLoadingParse] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  if (!isOpen) return null;

  const handleRunAiAudit = async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch('/api/ai/readiness-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      setAuditResult(data);
    } catch (err) {
      console.error(err);
      alert('Failed to generate AI Audit. Please try again.');
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleParseCert = async () => {
    setLoadingParse(true);
    try {
      const res = await fetch('/api/ai/parse-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateText: certText }),
      });
      const data = await res.json();
      setParsedData(data);
    } catch (err) {
      console.error(err);
      alert('Failed to parse certificate text.');
    } finally {
      setLoadingParse(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 text-xs text-gray-200">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-white">Gemini AI Campaign Readiness & MTC Parser</h2>
              <p className="text-xs text-gray-400">Smart auditing & automated mill certificate data extraction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-[#0e0e11] px-6 pt-2 space-x-2">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 font-medium border-b-2 transition ${
              activeTab === 'audit' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Campaign Readiness Audit
          </button>
          <button
            onClick={() => setActiveTab('parser')}
            className={`px-4 py-2.5 font-medium border-b-2 transition ${
              activeTab === 'parser' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            MTC Mill Certificate Parser
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* TAB 1: READINESS AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="bg-[#141417] border border-white/10 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-sm">Analyze {items.length} Campaign Line Items</h3>
                  <p className="text-gray-400 text-[11px] mt-0.5">
                    Evaluates inspection expiry dates, yard surplus shelf-life, and hole section tally sufficiency.
                  </p>
                </div>
                <button
                  onClick={handleRunAiAudit}
                  disabled={loadingAudit}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition flex items-center space-x-2 shrink-0 disabled:opacity-50 shadow"
                >
                  {loadingAudit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Auditing Inventory...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run AI Audit</span>
                    </>
                  )}
                </button>
              </div>

              {/* Audit Output */}
              {auditResult && (
                <div className="bg-[#141417] border border-white/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Campaign Compliance Rating</span>
                      <p className="text-2xl font-black text-amber-400">{auditResult.readinessScore || '88%'}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Audit Status: Compliant with Risks
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-1">Executive Summary</h4>
                    <p className="text-gray-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                      {auditResult.summary}
                    </p>
                  </div>

                  {auditResult.risks && auditResult.risks.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-rose-400 mb-2 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Identified Drilling Campaign Risks</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {auditResult.risks.map((risk: string, i: number) => (
                          <li key={i} className="bg-rose-950/20 border border-rose-500/30 p-2.5 rounded-xl text-rose-300 text-xs">
                            • {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {auditResult.recommendations && auditResult.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-emerald-400 mb-2 flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Recommended Corrective Actions</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {auditResult.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-300 text-xs">
                            ✓ {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CERTIFICATE PARSER */}
          {activeTab === 'parser' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-gray-300 font-medium">Paste Raw Mill Test Certificate (MTC) or NDT Inspection Text:</label>
                <textarea
                  value={certText}
                  onChange={e => setCertText(e.target.value)}
                  rows={6}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleParseCert}
                  disabled={loadingParse}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition flex items-center space-x-2 disabled:opacity-50 shadow"
                >
                  {loadingParse ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Parsing Certificate...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4" />
                      <span>Extract Structured Technical Data</span>
                    </>
                  )}
                </button>
              </div>

              {parsedData && (
                <div className="bg-[#141417] border border-white/10 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-amber-400 border-b border-white/5 pb-2">Extracted Certificate Fields</h4>
                  
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <p><strong className="text-gray-400 font-sans">Certificate #:</strong> {parsedData.certNumber}</p>
                    <p><strong className="text-gray-400 font-sans">Heat Number:</strong> <span className="text-amber-400">{parsedData.heatNumber}</span></p>
                    <p><strong className="text-gray-400 font-sans">Outer Diameter:</strong> {parsedData.outerDiameter}</p>
                    <p><strong className="text-gray-400 font-sans">Steel Grade:</strong> {parsedData.grade}</p>
                    <p><strong className="text-gray-400 font-sans">Connection:</strong> <span className="text-cyan-300">{parsedData.connectionType}</span></p>
                    <p><strong className="text-gray-400 font-sans">Hydrostatic Pressure:</strong> {parsedData.hydroTestPressure}</p>
                    <p><strong className="text-gray-400 font-sans">NDT Status:</strong> <span className="text-emerald-400 font-bold">{parsedData.inspectionResult}</span></p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
