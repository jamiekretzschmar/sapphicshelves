
import React, { useState, useRef } from 'react';
import { geminiService } from '../services/gemini';

interface ScannerProps {
  onBooksFound: (books: any[]) => void;
  onScanningStateChange: (scanning: boolean) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onBooksFound, onScanningStateChange }) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Reads multiple files concurrently and updates the preview state.
   * Standard <input type="file" multiple> allows users to select from their gallery or take a photo.
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;

    const files = Array.from(filesList);
    
    const readAsDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error("Failed to read file"));
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const newPreviews = await Promise.all(files.map(readAsDataURL));
      setPreviews(prev => [...prev, ...newPreviews]);
    } catch (err) {
      console.error("Error reading shelf photos:", err);
    }
    
    // Reset the input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startScan = async () => {
    if (previews.length === 0) return;
    setIsProcessing(true);
    onScanningStateChange(true);

    try {
      const foundBooks = await geminiService.scanShelf(previews);
      onBooksFound(foundBooks);
      setPreviews([]);
    } catch (error) {
      console.error("Scan failed", error);
      alert("The archivist encountered an error during transcription. Please try again.");
    } finally {
      setIsProcessing(false);
      onScanningStateChange(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-mica-surface border border-ink/5 p-8 rounded-3xl shadow-sm text-center">
        <div className="font-header text-3xl mb-2 italic">Behold the shelves.</div>
        <p className="text-ink/60 text-sm mb-8 leading-relaxed">
          Select one or more photos from your device or capture new ones. 
          Gemini will meticulously analyze every spine to build your digital monograph.
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
              className="w-full sm:w-auto px-8 py-4 bg-gold text-parchment rounded-2xl text-xs font-bold tracking-[0.2em] uppercase hover:bg-gold/90 disabled:bg-gold/30 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
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
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Scanner;
