// ── Cloudinary Image Upload Service ──────────────────────────────────────
// Free plan: 25GB storage, 25GB bandwidth/month — NO credit card needed
// Unsigned uploads — works directly from browser

// ⚠️ Replace CLOUD_NAME with your actual Cloudinary cloud name
const CLOUD_NAME   = 'YOUR_CLOUD_NAME';  // e.g. 'kruncheez'
const UPLOAD_PRESET = 'kruncheez_menu';  // unsigned preset name

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

// ── Upload image to Cloudinary ─────────────────────────────────────────────
export const uploadToCloudinary = (file, folder = 'menu', onProgress = null) => {
  return new Promise((resolve, reject) => {
    // Validate
    if (!file.type.startsWith('image/')) {
      reject(new Error('Only image files allowed'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Image must be under 10MB'));
      return;
    }

    const formData = new FormData();
    formData.append('file',           file);
    formData.append('upload_preset',  UPLOAD_PRESET);
    formData.append('folder',         `kruncheez/${folder}`);

    // Use XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url:       data.secure_url,
          publicId:  data.public_id,
          width:     data.width,
          height:    data.height,
          format:    data.format,
          size:      data.bytes,
        });
      } else {
        const err = JSON.parse(xhr.responseText);
        reject(new Error(err.error?.message || 'Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.open('POST', UPLOAD_URL);
    xhr.send(formData);
  });
};

// ── Delete image from Cloudinary (requires backend — skip for now) ─────────
// Cloudinary delete requires API secret (backend only)
// For now just remove from Firestore record

// ── Get optimized URL with transformations ─────────────────────────────────
export const getOptimizedUrl = (url, { width = 400, quality = 'auto' } = {}) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  // Insert transformations into Cloudinary URL
  return url.replace(
    '/upload/',
    `/upload/w_${width},q_${quality},f_auto/`
  );
};

// ── Check if Cloudinary is configured ─────────────────────────────────────
export const isCloudinaryConfigured = () => CLOUD_NAME !== 'YOUR_CLOUD_NAME';
