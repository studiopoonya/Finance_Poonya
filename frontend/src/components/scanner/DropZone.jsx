import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, FileText, X } from 'lucide-react';
import clsx from 'clsx';

export default function DropZone({ onFile, disabled }) {
  const [dragging, setDragging] = useState(false);
  const [preview,  setPreview]  = useState(null);
  const [fileName, setFileName] = useState(null);

  const accept = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']);

  const handleFile = useCallback((file) => {
    if (!file || !accept.has(file.type)) return;
    setFileName(file.name);
    if (file.type !== 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
    onFile(file);
  }, [onFile]);

  const onDrop = useCallback(e => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const onInputChange = e => handleFile(e.target.files[0]);

  const clear = e => {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    onFile(null);
  };

  return (
    <label
      onDragOver={e => { e.preventDefault(); setDragging(true);  }}
      onDragLeave={()  => setDragging(false)}
      onDrop={onDrop}
      className={clsx(
        'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden',
        'min-h-[420px]',
        dragging
          ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
          : preview
            ? 'border-slate-200 dark:border-white/10 bg-transparent'
            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/5',
        disabled && 'pointer-events-none opacity-60'
      )}
    >
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />

      {preview ? (
        <div className="w-full h-full relative group">
          <img
            src={preview}
            alt="Receipt preview"
            className="w-full h-full object-contain rounded-xl"
            style={{ maxHeight: '420px' }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={clear}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-full p-2 shadow-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="absolute bottom-3 left-3 glass rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 max-w-[80%] truncate">
            {fileName}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 p-10 text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
              <Upload size={32} className="text-indigo-500 dark:text-indigo-400" />
            </div>
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 rounded-full flex items-center justify-center">
              <ImageIcon size={12} className="text-emerald-600 dark:text-emerald-400" />
            </span>
            <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-violet-100 dark:bg-violet-500/20 border border-violet-300 dark:border-violet-500/30 rounded-full flex items-center justify-center">
              <FileText size={12} className="text-violet-600 dark:text-violet-400" />
            </span>
          </div>

          <div>
            <p className="text-slate-900 dark:text-white font-semibold text-base">
              Drop your receipt here
            </p>
            <p className="text-slate-500 text-sm mt-1.5 max-w-xs">
              Drag & drop a receipt image or click to browse.<br />
              Supports JPEG, PNG, WebP, PDF — up to 10 MB.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-slate-200 dark:bg-white/10" />
            <span className="text-slate-400 dark:text-slate-600 text-xs">or</span>
            <span className="h-px w-12 bg-slate-200 dark:bg-white/10" />
          </div>

          <span className="px-5 py-2.5 bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-500/40 text-white text-sm font-medium rounded-xl transition-colors">
            Browse files
          </span>
        </div>
      )}
    </label>
  );
}
