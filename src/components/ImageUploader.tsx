import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (file: File | null) => void;
  className?: string;
}

export default function ImageUploader({ onImageSelect, className = "" }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        onImageSelect(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onImageSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-[2.5rem] transition-all duration-300 group cursor-pointer overflow-hidden ${
        isDragging ? 'border-secondary bg-secondary/5' : 'border-primary/5 hover:border-primary/10 hover:bg-accent-soft/30'
      } ${preview ? 'aspect-video' : 'p-12'} ${className}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept="image/*"
        onChange={onFileChange}
      />

      {preview ? (
        <div className="absolute inset-0">
          <img src={preview} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <p className="text-white text-[10px] font-bold uppercase tracking-widest">Changer l'image</p>
          </div>
          <button 
            onClick={clearImage}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-secondary transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm transition-transform duration-300 ${isDragging ? 'scale-110 text-secondary' : 'text-primary/20 group-hover:text-secondary group-hover:scale-110'}`}>
            <Upload className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
              {isDragging ? 'Déposez ici' : 'Ajouter une photo'}
            </p>
            <p className="text-[9px] text-primary/30 uppercase tracking-tight">PNG, JPG ou GIF jusqu'à 10Mo</p>
          </div>
        </div>
      )}
    </div>
  );
}
