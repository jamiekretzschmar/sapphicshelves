
import React, { useState, useRef } from 'react';
import { geminiService } from '../services/gemini';
import { compressImage } from '../utils/image';

interface ScannerProps {
  onBooksFound: (books: any[]) => void;
  onScanningStateChange: (scanning: boolean) => void;
  onKeyError: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onBooksFound, onScanningStateChange, onKeyError }) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<'NONE' | 'KEY_REVOKED' | 'GENERAL'>('NONE');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;

    const files = Array.from(filesList);
    
    const readAndCompress = async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          if (typeof reader.result === 'string') {
            const compressed = await compressImage(reader.result, 0.7);
            resolve(compressed);
          }
          else reject(new Error("Failed to read file"));
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const newPreviews = await Promise.all(files.map(readAndCompress));
      setPreviews(prev => [...prev, ...newPreviews]);
      setErrorStatus('NONE');
    } catch (err) {
      console.error("Error reading shelf photos:", err);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startScan = async () => {
    if (previews.length === 0) return;
    setIsProcessing(true);
    onScanningStateChange(true);
    setErrorStatus('NONE');

    try {
      const foundBooks = await geminiService.scanShelf(previews);
      onBooksFound(foundBooks);
      setPreviews([]);
    } catch (error: any) {
      console.error("Scan failed", error);
      if (error.message?.includes('403') || error.message?.includes('leaked')) {
        setErrorStatus('KEY_REVOKED');
        onKeyError();
      } else {
        setErrorStatus('GENERAL');
      }
    } finally {
      setIsProcessing(false);
      onScanningStateChange(false);
    }
  };

  const handleRotateKey = async () => {
    if (typeof window.aistudio?.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setErrorStatus('NONE');
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-mica-surface border border-ink/5 p-8 rounded-3xl shadow-sm text-center relative overflow-hidden">
        {errorStatus === 'KEY_REVOKED' && (
          <div className="absolute inset-0 z-20 bg-rose/95 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="space-y-4 max-w-sm text-parchment">
              <h4 className="font-header text-2xl italic">Protocol Revoked</h4>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                Your archival API key has been reported as leaked or is invalid.
              </p>
              <button 
                onClick={handleRotateKey}
                className="w-full py-3 bg-parchment text-rose rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95"
              >
                Rotate Archival Key
              </button>
              <button 
                onClick={() => setErrorStatus('NONE')}
                className="text-[9px] font-bold uppercase tracking-widest opacity-50 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="font-header text-3xl mb-2 italic">Behold the shelves.</div>
        <p className="text-ink/60 text-sm mb-8 leading-relaxed">
          Select photos of your collection. Gemini will meticulously analyze every spine to transform your physical library into a digital monograph.
        </p>
        
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          onChange={handleFileChange} 
          ref={fileInputRef} 
          className="hidden" 
        />
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-8 py-4 border-2 border-ink rounded-2xl text-xs font-bold tracking-[0.2em] uppercase hover:bg-ink hover:text-parchment transition-all duration-300 active:scale-95"
          >
            Select Photos
          </button>
          
          {previews.length > 0 && (
            <button 
              onClick={startScan}
              disabled={isProcessing}
              className="w-full sm:w-auto px-8 py-4 bg-brand-cyan text-brand-deep rounded-2xl text-xs font-bold tracking-[0.2em] uppercase hover:bg-brand-glow disabled:opacity-50 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <span className="animate-pulse">Consulting Scribes...</span>
              ) : (
                `Archivize ${previews.length} Image${previews.length > 1 ? 's' : ''}`
              )}
            </button>
          )}
        </div>
      </section>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previews.map((src, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden border border-ink/10 relative group animate-in fade-in zoom-in duration-300">
              <img src={src} className="w-full h-full object-cover" alt={`Preview ${i}`} />
              <button 
                onClick={() => setPreviews(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute top-3 right-3 w-8 h-8 bg-ink/80 text-parchment rounded-full backdrop-blur-md flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Scanner;
