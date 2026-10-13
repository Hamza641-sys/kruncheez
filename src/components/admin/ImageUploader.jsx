import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Check, Image, Loader } from 'lucide-react';
import { uploadToCloudinary, isCloudinaryConfigured } from '../../firebase/cloudinaryService';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const ImageUploader = ({
  folder       = 'menu',
  onUploaded,              // callback(url, publicId)
  currentImage = null,     // existing image URL
  label        = 'Upload Image',
  compact      = false,
}) => {
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [preview,   setPreview]   = useState(currentImage);
  const [done,      setDone]      = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file', toastStyle);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB', toastStyle);
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    setProgress(0);
    setDone(false);

    try {
      if (!isCloudinaryConfigured()) {
        throw new Error('Cloudinary not configured yet. Please add Cloud Name.');
      }
      const result = await uploadToCloudinary(file, folder, (pct) => setProgress(pct));
      setDone(true);
      setPreview(result.url);
      toast.success('Image uploaded successfully! ✅', toastStyle);
      if (onUploaded) onUploaded(result.url, result.publicId);
    } catch (err) {
      toast.error(err.message || 'Upload failed. Check Cloudinary setup.', toastStyle);
      setPreview(currentImage);
      setDone(false);
    } finally {
      setUploading(false);
    }
  }, [folder, onUploaded, currentImage]);

  const onDrop     = useCallback((e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }, [handleFile]);
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onChange    = (e) => { const f = e.target.files[0]; if (f) handleFile(f); };
  const clearImage  = ()  => { setPreview(null); setDone(false); if (onUploaded) onUploaded(null, null); };

  // ── COMPACT MODE ───────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="relative">
        <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          className={`relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
            dragging ? 'border-krunch-red bg-krunch-red/10' : 'border-krunch-border hover:border-krunch-red'
          } ${preview ? 'h-32' : 'h-24'}`}
        >
          {preview ? (
            <>
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <p className="text-white font-body text-xs text-center px-2">Click to change</p>
              </div>
              {!uploading && (
                <button onClick={(e) => { e.stopPropagation(); clearImage(); }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700">
                  <X size={12} />
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-1.5">
              <Image size={20} className="text-krunch-gray" />
              <p className="text-krunch-gray font-body text-[10px] text-center px-2">Click or drag image</p>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
              <Loader size={20} className="text-krunch-red animate-spin" />
              <div className="w-3/4 h-1.5 bg-krunch-border rounded-full overflow-hidden">
                <motion.div animate={{ width: `${progress}%` }} className="h-full bg-krunch-red rounded-full" transition={{ duration: 0.3 }} />
              </div>
              <p className="text-white font-body text-[10px]">{progress}%</p>
            </div>
          )}
          {done && !uploading && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute top-1.5 left-1.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check size={12} className="text-white" />
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ── FULL MODE ──────────────────────────────────────────────────────────
  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
          dragging ? 'border-krunch-red bg-krunch-red/10 scale-[1.01]' : 'border-krunch-border hover:border-krunch-red hover:bg-krunch-card'
        } ${preview ? 'h-48' : 'h-36'}`}
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" className="w-full h-full object-cover rounded-xl" />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
              <Upload size={24} className="text-white" />
              <p className="text-white font-body text-sm font-semibold">Click to change image</p>
            </div>
            {!uploading && (
              <button onClick={(e) => { e.stopPropagation(); clearImage(); }}
                className="absolute top-3 right-3 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 shadow-lg">
                <X size={16} />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${dragging ? 'bg-krunch-red' : 'bg-krunch-red/10'}`}>
              <Upload size={22} className="text-krunch-red" />
            </div>
            <div className="text-center">
              <p className="text-white font-body font-semibold text-sm">
                {dragging ? '📸 Drop image here!' : 'Click or drag image here'}
              </p>
              <p className="text-krunch-gray font-body text-xs mt-0.5">JPG, PNG, WEBP — max 10MB</p>
            </div>
          </div>
        )}

        {/* Upload progress */}
        <AnimatePresence>
          {uploading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3 rounded-xl">
              <Loader size={28} className="text-krunch-red animate-spin" />
              <div className="w-2/3">
                <div className="flex justify-between text-xs font-body mb-1.5">
                  <span className="text-krunch-gray">Uploading to Cloudinary...</span>
                  <span className="text-krunch-red font-bold">{progress}%</span>
                </div>
                <div className="h-2 bg-krunch-border rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-krunch-red to-red-400 rounded-full"
                    transition={{ duration: 0.3 }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success */}
        <AnimatePresence>
          {done && !uploading && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-600 text-white text-xs font-body font-bold px-3 py-1.5 rounded-full shadow-lg">
              <Check size={13} /> Uploaded to Cloudinary!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-2">
        <p className="text-krunch-gray font-body text-xs">{label}</p>
        {preview && !uploading && (
          <button onClick={() => inputRef.current?.click()}
            className="text-krunch-red font-body text-xs hover:text-white transition-colors">
            Change image
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
