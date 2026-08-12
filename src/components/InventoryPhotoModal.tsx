import React, { useState, useRef, useEffect } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { TubularItem, ItemPhotoRecord } from '../types/drilling';
import { 
  Camera, 
  Upload, 
  X, 
  Image as ImageIcon, 
  CheckCircle2, 
  Trash2, 
  ZoomIn, 
  UserCheck, 
  Calendar, 
  Tag, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface InventoryPhotoModalProps {
  item: TubularItem;
  isOpen: boolean;
  onClose: () => void;
}

export const InventoryPhotoModal: React.FC<InventoryPhotoModalProps> = ({ item, isOpen, onClose }) => {
  const { addItemPhoto, currentUser } = useDrilling();

  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'gallery'>('camera');
  const [photoType, setPhotoType] = useState<ItemPhotoRecord['photoType']>('Thread & Pin Inspection');
  const [caption, setCaption] = useState('');
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  
  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<ItemPhotoRecord | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable or blocked. Please select "Upload File / Photo Roll" tab.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImageBase64(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedImageBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (!capturedImageBase64) return;

    addItemPhoto(item.id, {
      photoUrl: capturedImageBase64,
      caption: caption || `${photoType} proof for item ${item.tagNumber}`,
      photoType,
      capturedBy: currentUser?.name || 'Matco Inspector',
      role: currentUser?.role || 'Materials Coordinator (Supply Base)',
      gpsLocation: item.currentLocation
    });

    setCapturedImageBase64(null);
    setCaption('');
    setActiveTab('gallery');
  };

  if (!isOpen) return null;

  const photosList = item.photos || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#121319] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#181a22] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Real-Time Matco Photo Capture & Inspection Proof
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Live DB Upload
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Item: <strong className="text-amber-400">{item.tagNumber}</strong> ({item.name}) | S/N: <span className="text-gray-200">{item.serialNumber}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 py-3 bg-[#14151d] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setCapturedImageBase64(null);
                setActiveTab('camera');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'camera' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Live Camera
            </button>
            <button
              onClick={() => {
                setCapturedImageBase64(null);
                setActiveTab('upload');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'upload' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image File
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'gallery' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Item Photo Gallery ({photosList.length})
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">

          {/* Camera Tab */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {!capturedImageBase64 ? (
                <div className="bg-[#181a22] p-4 rounded-2xl border border-white/10 flex flex-col items-center">
                  {cameraError ? (
                    <div className="p-6 text-center text-xs text-amber-400 bg-amber-500/10 rounded-xl border border-amber-500/30 max-w-md my-4">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                      <p>{cameraError}</p>
                    </div>
                  ) : (
                    <div className="relative w-full max-w-xl aspect-video bg-black rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                      <div className="absolute top-3 left-3 bg-red-500/80 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        LIVE CAMERA STREAM
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center space-x-3">
                    {isCameraActive && (
                      <button
                        onClick={capturePhoto}
                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Snap Photo
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Captured Preview & Save Form */
                <div className="bg-[#181a22] p-5 rounded-2xl border border-white/10 space-y-4">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    Preview Captured Photo
                  </h4>

                  <div className="flex flex-col md:flex-row gap-5">
                    <div className="w-full md:w-1/2 aspect-video bg-black rounded-xl overflow-hidden border border-white/10">
                      <img src={capturedImageBase64} alt="Captured preview" className="w-full h-full object-cover" />
                    </div>

                    <div className="w-full md:w-1/2 space-y-3 text-xs">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Inspection Category *</label>
                        <select
                          value={photoType}
                          onChange={(e) => setPhotoType(e.target.value as any)}
                          className="w-full px-3 py-2 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                        >
                          <option value="Thread & Pin Inspection">Thread & Pin Inspection</option>
                          <option value="Tally Tag & Serial Stencil">Tally Tag & Serial Stencil</option>
                          <option value="Storage Yard Rack">Storage Yard Rack</option>
                          <option value="Damage / Wear Defect">Damage / Wear Defect</option>
                          <option value="Vessel Loading / Backload">Vessel Loading / Backload</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Photo Remarks / Inspector Caption</label>
                        <textarea
                          rows={3}
                          placeholder="e.g. Clean threads, seal surface free from pitting. Stencil matches tally."
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          className="w-full px-3 py-2 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <button
                          onClick={() => {
                            setCapturedImageBase64(null);
                            startCamera();
                          }}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs"
                        >
                          Retake
                        </button>
                        <button
                          onClick={handleSavePhoto}
                          className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-4 h-4" />
                          Save & Sync Photo to DB
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-4 bg-[#181a22] p-6 rounded-2xl border border-white/10">
              {!capturedImageBase64 ? (
                <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-amber-500/50 transition">
                  <Upload className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-white">Select Photo or Drag and Drop Image</h4>
                  <p className="text-xs text-gray-400 mt-1">Supports JPEG, PNG, WebP format (automatic compression)</p>

                  <label className="inline-block mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl cursor-pointer transition shadow-md shadow-amber-500/20">
                    Browse File System
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-5">
                    <div className="w-full md:w-1/2 aspect-video bg-black rounded-xl overflow-hidden border border-white/10">
                      <img src={capturedImageBase64} alt="Uploaded preview" className="w-full h-full object-cover" />
                    </div>

                    <div className="w-full md:w-1/2 space-y-3 text-xs">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Inspection Category *</label>
                        <select
                          value={photoType}
                          onChange={(e) => setPhotoType(e.target.value as any)}
                          className="w-full px-3 py-2 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                        >
                          <option value="Thread & Pin Inspection">Thread & Pin Inspection</option>
                          <option value="Tally Tag & Serial Stencil">Tally Tag & Serial Stencil</option>
                          <option value="Storage Yard Rack">Storage Yard Rack</option>
                          <option value="Damage / Wear Defect">Damage / Wear Defect</option>
                          <option value="Vessel Loading / Backload">Vessel Loading / Backload</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Photo Remarks / Inspector Caption</label>
                        <textarea
                          rows={3}
                          placeholder="e.g. Visual inspection proof uploaded from yard mobile tablet."
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          className="w-full px-3 py-2 bg-[#121319] border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <button
                          onClick={() => setCapturedImageBase64(null)}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs"
                        >
                          Clear Selection
                        </button>
                        <button
                          onClick={handleSavePhoto}
                          className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-4 h-4" />
                          Save & Sync Photo to DB
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Photo Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              {photosList.length === 0 ? (
                <div className="p-8 text-center bg-[#181a22] rounded-2xl border border-white/10 text-gray-400 text-xs">
                  <ImageIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  No photos uploaded for this item yet. Use the "Live Camera" or "Upload Image File" tabs above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {photosList.map(p => (
                    <div key={p.id} className="bg-[#181a22] border border-white/10 rounded-2xl overflow-hidden group hover:border-amber-500/40 transition">
                      <div className="relative aspect-video bg-black overflow-hidden">
                        <img src={p.photoUrl} alt={p.caption} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        <button
                          onClick={() => setZoomedPhoto(p)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-amber-500 hover:text-black transition"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded bg-amber-500/90 text-black font-bold">
                          {p.photoType}
                        </span>
                      </div>

                      <div className="p-3 text-xs space-y-1">
                        <p className="text-white font-medium line-clamp-2">{p.caption}</p>
                        <div className="text-[10px] text-gray-400 pt-1 flex items-center justify-between border-t border-white/5">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-amber-400" />
                            {p.capturedBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            {p.capturedAt.slice(0, 10)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Zoom Lightbox */}
      {zoomedPhoto && (
        <div className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setZoomedPhoto(null)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={zoomedPhoto.photoUrl} alt="Zoomed view" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl border border-white/20" />
            <div className="mt-3 p-3 bg-black/80 rounded-xl text-white text-xs border border-white/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-400">{zoomedPhoto.photoType}</span>
                <p className="text-gray-300">{zoomedPhoto.caption}</p>
              </div>
              <div className="text-right text-gray-400 text-[11px]">
                <p>Inspector: {zoomedPhoto.capturedBy}</p>
                <p>{zoomedPhoto.capturedAt}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
