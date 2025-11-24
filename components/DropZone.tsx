
import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, AlertTriangle } from 'lucide-react';

interface DropZoneProps {
  onImageSelected: (base64: string, width: number, height: number) => void;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onImageSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    if (!file.type.match('image.*')) {
      setError('Please upload an image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('File size too large. Max 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onImageSelected(e.target?.result as string, img.width, img.height);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [disabled, processFile]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
      if (disabled) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
              const blob = items[i].getAsFile();
              if (blob) processFile(blob);
          }
      }
  }, [disabled, processFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer
        group overflow-hidden
        ${isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Input Element */}
      <input
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={disabled}
      />

      <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 pointer-events-none">
        <div className="p-3 sm:p-4 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
          {isDragging ? (
            <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 animate-bounce" />
          ) : (
            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white/70" />
          )}
        </div>
        
        <div className="space-y-1 sm:space-y-2">
          <p className="text-base sm:text-lg font-medium text-white">
            Drag & drop or click to upload
          </p>
          <p className="text-xs sm:text-sm text-white/50">
            Supports JPG, PNG, WebP (Max 15MB)
          </p>
        </div>

        {error && (
           <div className="flex items-center gap-2 text-red-400 text-xs sm:text-sm bg-red-900/20 px-3 py-2 rounded-lg">
             <AlertTriangle size={16} />
             {error}
           </div>
        )}
      </div>
    </div>
  );
};
