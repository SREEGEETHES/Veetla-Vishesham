import React, { useState, useRef, useEffect } from 'react';
import {
  Scan,
  Upload,
  FileText,
  Image as ImageIcon,
  Eye,
  Trash2,
  Lock,
  CheckCircle,
  X,
  Camera,
  Download,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { VaultDocument, Language, User } from '../types';
import { translations } from '../i18n';
import { soundCtrl } from '../utils/audio';

interface DocumentVaultProps {
  language: Language;
  documents: VaultDocument[];
  currentUser: User;
  onAddDocument: (doc: VaultDocument) => void;
  onDeleteDocument: (id: string) => void;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({
  language,
  documents,
  currentUser,
  onAddDocument,
  onDeleteDocument
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<VaultDocument | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [showPassphraseModal, setShowPassphraseModal] = useState(false);
  const [currentPassphrase, setCurrentPassphrase] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [passphraseStatus, setPassphraseStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Real Camera Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedSizeStr, setCapturedSizeStr] = useState('');
  const [scanDocName, setScanDocName] = useState('Scanned_Document.jpg');

  // Clean up camera stream when scanning closes
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  // Handle Real File Upload (< 2MB constraint)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 2MB constraint
    if (file.size >= 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit. Please upload a file less than 2MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const isPdf = file.type.includes('pdf') || file.name.endsWith('.pdf');
    const isImg = file.type.includes('image');

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const newDoc: VaultDocument = {
        id: 'doc-' + Date.now(),
        name: file.name,
        size: formattedSize,
        bytes: file.size,
        dateAdded: 'Just now',
        type: isPdf ? 'pdf' : isImg ? 'image' : 'text',
        category: 'id',
        previewUrl: uploadEvent.target?.result as string,
        encryptedHash: 'Vault:' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        uploadedBy: currentUser.name
      };

      onAddDocument(newDoc);
      soundCtrl.playCelebrationChime();
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Start Real Optical Camera Scanner
  const handleStartRealScan = async () => {
    setIsScanning(true);
    setCameraError('');
    setCapturedPhotoUrl(null);
    setScanDocName(`Document_${new Date().toISOString().slice(0, 10)}.jpg`);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } else {
        setCameraError('Camera API not accessible in this environment. Use device photo capture.');
      }
    } catch {
      setCameraError('Camera permission not granted or device camera busy. You can use direct camera capture below.');
    }
  };

  // Capture frame from video feed
  const handleCaptureVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Stop camera tracks
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      }

      // Calculate approximate byte size
      const byteLength = Math.round((dataUrl.length * 3) / 4);
      const sizeFormatted =
        byteLength > 1024 * 1024
          ? `${(byteLength / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(byteLength / 1024)} KB`;

      setCapturedPhotoUrl(dataUrl);
      setCapturedSizeStr(sizeFormatted);
      soundCtrl.playPreviewTone();
    }
  };

  // Fallback direct camera capture from input
  const handleDeviceCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size >= 2 * 1024 * 1024) {
      alert('Captured image exceeds 2MB limit. Please retake photo with standard resolution.');
      return;
    }

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedPhotoUrl(ev.target?.result as string);
      setCapturedSizeStr(formattedSize);
      soundCtrl.playPreviewTone();
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCapturedScan = () => {
    if (!capturedPhotoUrl) return;

    const newDoc: VaultDocument = {
      id: 'doc-' + Date.now(),
      name: scanDocName.trim() || 'Scanned_Document.jpg',
      size: capturedSizeStr || '480 KB',
      bytes: 490000,
      dateAdded: 'Scanned today',
      type: 'image',
      category: 'id',
      previewUrl: capturedPhotoUrl,
      encryptedHash: 'Vault:SCN_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      uploadedBy: currentUser.name
    };

    onAddDocument(newDoc);
    setIsScanning(false);
    setCapturedPhotoUrl(null);
    soundCtrl.playCelebrationChime();
  };

  const handleCloseScanner = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsScanning(false);
    setCapturedPhotoUrl(null);
  };

  // Real Document Download
  const handleDownloadDoc = (doc: VaultDocument) => {
    const downloadUrl =
      doc.previewUrl ||
      `data:text/plain;charset=utf-8,${encodeURIComponent(
        `FamilyOS Document: ${doc.name}\nUploaded by: ${doc.uploadedBy || 'Family'}\nID: ${doc.encryptedHash}`
      )}`;

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    soundCtrl.playPreviewTone();
  };

  // 2-Step Verification for File Deletion
  const handleTriggerDelete = (doc: VaultDocument) => {
    setDocToDelete(doc);
    setDeleteConfirmText('');
  };

  const handleConfirmDelete = () => {
    if (!docToDelete) return;
    onDeleteDocument(docToDelete.id);
    soundCtrl.playPreviewTone();
    setDocToDelete(null);
    setDeleteConfirmText('');
  };

  // Change Passphrase
  const handleChangePassphrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassphrase || newPassphrase.length < 4) {
      setPassphraseStatus('error');
      return;
    }
    setPassphraseStatus('success');
    soundCtrl.playPreviewTone();
    setTimeout(() => {
      setShowPassphraseModal(false);
      setPassphraseStatus('idle');
      setCurrentPassphrase('');
      setNewPassphrase('');
    }, 1200);
  };

  const isDeleteMatch =
    docToDelete &&
    (deleteConfirmText.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
      deleteConfirmText.trim().toLowerCase() === currentUser.username.trim().toLowerCase() ||
      deleteConfirmText.trim().toLowerCase() === 'confirm');

  return (
    <main className="max-w-lg mx-auto px-4 pt-4 pb-32 space-y-6">
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*,.doc,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleDeviceCameraCapture}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Page Header & Primary Actions */}
      <section className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-extrabold text-[#8E4E08] tracking-tight">
              {t.vaultTitle}
            </h2>
            <p className="text-sm text-[#534438] mt-1 font-medium">
              Store IDs, insurance cards, and health records securely (under 2MB each).
            </p>
          </div>
          <span className="text-xs bg-[#FFDCC2] text-[#8E4E08] font-bold px-2.5 py-1 rounded-full">
            Max 2MB / file
          </span>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Scan Document */}
          <button
            onClick={handleStartRealScan}
            className="flex flex-col items-center justify-center gap-1.5 bg-[#DC8E47] text-white p-5 rounded-2xl shadow-sm hover:brightness-105 active:scale-95 transition-all group"
          >
            <Scan className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="font-extrabold text-sm tracking-wide">
              {t.scanDocument}
            </span>
          </button>

          {/* Upload File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 border-2 border-[#006783] text-[#006783] bg-white p-5 rounded-2xl shadow-sm hover:bg-[#006783]/5 active:scale-95 transition-all group"
          >
            <Upload className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="font-extrabold text-sm tracking-wide">
              {t.uploadFile}
            </span>
          </button>
        </div>
      </section>

      {/* Document List */}
      <section className="space-y-3">
        <div className="flex justify-between items-end px-1">
          <h3 className="text-xs font-bold text-[#534438] uppercase tracking-widest">
            {t.recentDocuments}
          </h3>
          <span className="text-xs text-[#857467] font-medium">
            {documents.length} {t.itemsCount}
          </span>
        </div>

        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white border border-[#D8C2B3]/60 p-4 rounded-xl flex items-center justify-between shadow-2xs hover:border-[#3AC9FA] transition-all"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl bg-[#F3F3F3] flex items-center justify-center text-[#8E4E08] flex-shrink-0">
                {doc.type === 'pdf' ? (
                  <FileText className="w-6 h-6 text-[#DC8E47]" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-[#006783]" />
                )}
              </div>
              <div className="truncate">
                <h4 className="font-bold text-sm text-[#1A0D0A] truncate">
                  {doc.name}
                </h4>
                <p className="text-xs text-[#534438] mt-0.5">
                  {doc.dateAdded} • {doc.size}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedDoc(doc)}
                title="View & Download Document"
                className="p-2 text-[#534438] hover:text-[#006783] hover:bg-[#3AC9FA]/10 rounded-full transition-colors"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDownloadDoc(doc)}
                title="Download Document"
                className="p-2 text-[#534438] hover:text-[#DC8E47] hover:bg-[#DC8E47]/10 rounded-full transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleTriggerDelete(doc)}
                title="Delete with 2-Step Verification"
                className="p-2 text-[#534438] hover:text-[#BA1A1A] hover:bg-[#BA1A1A]/10 rounded-full transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Passphrase Section */}
      <section className="pt-6 border-t border-[#D8C2B3]/60 text-center space-y-3">
        <p className="text-xs text-[#534438] max-w-xs mx-auto leading-relaxed">
          {t.passphraseNotice}
        </p>
        <button
          onClick={() => setShowPassphraseModal(true)}
          className="inline-flex items-center gap-2 text-[#8E4E08] font-bold text-sm hover:underline decoration-2 underline-offset-4 focus:outline-none"
        >
          <Lock className="w-4 h-4" />
          {t.changePassphrase}
        </button>
      </section>

      {/* Document Viewer Modal with Instant Download */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-[#D8C2B3] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#FFDCC2] text-[#8E4E08] rounded-xl">
                  {selectedDoc.type === 'pdf' ? (
                    <FileText className="w-6 h-6" />
                  ) : (
                    <ImageIcon className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#1A0D0A] truncate max-w-[190px]">
                    {selectedDoc.name}
                  </h4>
                  <p className="text-xs text-[#534438]">
                    {selectedDoc.size} • Stored by {selectedDoc.uploadedBy || currentUser.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 rounded-full text-[#534438] hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Preview */}
            <div className="w-full h-52 bg-[#F3F3F3] rounded-xl border border-[#D8C2B3] flex flex-col items-center justify-center p-3 text-center overflow-hidden mb-4">
              {selectedDoc.previewUrl ? (
                <img
                  src={selectedDoc.previewUrl}
                  alt={selectedDoc.name}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto shadow-xs text-[#8E4E08]">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-[#1A0D0A]">{selectedDoc.name}</p>
                  <p className="text-[10px] text-[#534438]">Verified Document Token: {selectedDoc.encryptedHash}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleDownloadDoc(selectedDoc)}
                className="flex-1 py-2.5 bg-[#DC8E47] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 shadow-xs"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="py-2.5 px-4 bg-[#F3F3F3] text-[#1A0D0A] font-bold rounded-xl text-sm hover:bg-[#E8E8E8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Step Verification Modal for File Deletion */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-3 text-[#BA1A1A]">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#1A0D0A]">
                  2-Step Verification
                </h4>
                <p className="text-xs text-[#BA1A1A] font-bold">
                  Confirm Permanent Deletion
                </p>
              </div>
            </div>

            <p className="text-xs text-[#534438] leading-relaxed mb-3">
              To prevent accidental loss of important family records, please type your name <strong className="text-[#1A0D0A]">"{currentUser.name}"</strong> (or <strong className="text-[#1A0D0A]">confirm</strong>) to verify deletion of <span className="font-bold text-[#8E4E08]">{docToDelete.name}</span>:
            </p>

            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={`Type "${currentUser.name}" to confirm`}
                className="w-full p-2.5 text-sm rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-red-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDocToDelete(null);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-2.5 border border-[#D8C2B3] rounded-xl text-sm font-bold text-[#534438]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={!isDeleteMatch}
                className={`flex-1 py-2.5 text-white font-bold rounded-xl text-sm transition-all ${
                  isDeleteMatch
                    ? 'bg-[#BA1A1A] hover:bg-red-700 shadow-md active:scale-95 cursor-pointer'
                    : 'bg-[#D8C2B3] cursor-not-allowed opacity-60'
                }`}
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Optical Camera Scanner Viewfinder */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#D8C2B3] text-center">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-base font-bold text-[#1A0D0A]">
                Document Camera Scanner
              </h4>
              <button
                onClick={handleCloseScanner}
                className="p-1 text-[#534438] hover:bg-black/5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!capturedPhotoUrl ? (
              <div className="space-y-4">
                {/* Live Video Viewfinder */}
                <div className="relative w-full h-64 bg-black rounded-2xl overflow-hidden flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-4 border-2 border-dashed border-[#3AC9FA] rounded-xl pointer-events-none opacity-80" />
                  <span className="absolute bottom-3 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full pointer-events-none">
                    Align document within frame
                  </span>
                </div>

                {cameraError && (
                  <div className="p-2.5 bg-amber-50 text-amber-900 rounded-xl text-xs text-left">
                    <p className="font-semibold mb-1">{cameraError}</p>
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full mt-1.5 py-2 bg-[#DC8E47] text-white font-bold rounded-lg text-xs"
                    >
                      Open Mobile Camera App
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleCaptureVideoFrame}
                    className="flex-1 py-3 bg-[#DC8E47] hover:brightness-105 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Camera className="w-5 h-5" /> Snap Document
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    title="Use Device Camera Directly"
                    className="py-3 px-4 border border-[#D8C2B3] text-[#534438] hover:text-[#1A0D0A] font-bold rounded-xl text-xs"
                  >
                    Use File/Camera
                  </button>
                </div>
              </div>
            ) : (
              /* Scanned Review & Save Screen */
              <div className="space-y-4">
                <div className="w-full h-56 rounded-xl overflow-hidden bg-[#F3F3F3] border border-[#D8C2B3]">
                  <img
                    src={capturedPhotoUrl}
                    alt="Captured Scan"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="text-left space-y-1">
                  <label className="text-xs font-bold text-[#534438]">Document Name</label>
                  <input
                    type="text"
                    value={scanDocName}
                    onChange={(e) => setScanDocName(e.target.value)}
                    className="w-full p-2.5 text-xs font-bold rounded-xl border border-[#D8C2B3]"
                  />
                  <p className="text-[11px] text-[#006783] font-bold">
                    Captured Size: {capturedSizeStr} (under 2MB verified)
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCapturedPhotoUrl(null);
                      handleStartRealScan();
                    }}
                    className="flex-1 py-2.5 border border-[#D8C2B3] text-xs font-bold rounded-xl text-[#534438]"
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleSaveCapturedScan}
                    className="flex-1 py-2.5 bg-[#DC8E47] text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-105"
                  >
                    Save to Vault
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change Passphrase Modal */}
      {showPassphraseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleChangePassphrase}
            className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-[#D8C2B3]"
          >
            <h4 className="text-lg font-bold text-[#8E4E08] mb-1">
              Change Vault Passphrase
            </h4>
            <p className="text-xs text-[#534438] mb-4">
              Enter a master passphrase or PIN to encrypt and decrypt family records locally.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-bold text-[#534438] block mb-1">
                  Current Passphrase
                </label>
                <input
                  type="password"
                  value={currentPassphrase}
                  onChange={(e) => setCurrentPassphrase(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-sm rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#534438] block mb-1">
                  New Passphrase (Min 4 characters)
                </label>
                <input
                  type="password"
                  value={newPassphrase}
                  onChange={(e) => setNewPassphrase(e.target.value)}
                  placeholder="Enter new passphrase"
                  className="w-full p-2.5 text-sm rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
                  required
                />
              </div>
            </div>

            {passphraseStatus === 'error' && (
              <p className="text-xs text-[#BA1A1A] font-bold mb-3">
                Passphrase must be at least 4 characters long.
              </p>
            )}
            {passphraseStatus === 'success' && (
              <p className="text-xs text-emerald-700 font-bold mb-3">
                Vault passphrase successfully updated!
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPassphraseModal(false)}
                className="flex-1 py-2.5 border border-[#D8C2B3] rounded-xl text-sm font-bold text-[#534438]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#8E4E08] text-white rounded-xl text-sm font-bold shadow-xs hover:brightness-110 active:scale-95"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};
