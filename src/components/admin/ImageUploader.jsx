import { useState } from 'react';
import { Image, X } from 'lucide-react';

// Simple image URL input component (Cloudinary removed - using direct URL links)
const ImageUploader = ({ currentImage = null, onUploaded, label = 'Image URL' }) => {
  const [url, setUrl] = useState(currentImage || '');

  const handleChange = (e) => {
    setUrl(e.target.value);
    if (onUploaded) onUploaded(e.target.value, null);
  };

  const clear = () => {
    setUrl('');
    if (onUploaded) onUploaded(null, null);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-krunch-gray font-body text-xs uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className="flex-1 bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"
        />
        {url && (
          <button type="button" onClick={clear}
            className="w-10 h-10 rounded-xl bg-krunch-card border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-red-400 transition-colors">
            <X size={15} />
          </button>
        )}
      </div>
      {url && (
        <div className="h-24 rounded-xl overflow-hidden border border-krunch-border bg-krunch-black">
          <img src={url} alt="preview" className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; }} />
        </div>
      )}
      {!url && (
        <div className="h-16 rounded-xl border border-dashed border-krunch-border flex items-center justify-center gap-2 text-krunch-gray">
          <Image size={16} />
          <span className="font-body text-xs">Paste image URL above</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
