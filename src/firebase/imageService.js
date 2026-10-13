import {
  ref, uploadBytesResumable, getDownloadURL,
  deleteObject, listAll,
} from 'firebase/storage';
import { storage } from './config';

// ── Upload image to Firebase Storage ──────────────────────────────────────
export const uploadImage = (file, folder = 'menu', onProgress = null) => {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Only image files allowed'));
      return;
    }
    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image must be under 5MB'));
      return;
    }

    // Clean filename — remove spaces, add timestamp
    const ext      = file.name.split('.').pop().toLowerCase();
    const safeName = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    const fileName  = `${safeName}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          url:  downloadURL,
          path: `${folder}/${fileName}`,
          name: fileName,
          size: file.size,
        });
      }
    );
  });
};

// ── Delete image from Firebase Storage ────────────────────────────────────
export const deleteImage = async (imagePath) => {
  try {
    const storageRef = ref(storage, imagePath);
    await deleteObject(storageRef);
    return true;
  } catch (err) {
    console.error('Delete error:', err);
    return false;
  }
};

// ── List all images in a folder ────────────────────────────────────────────
export const listImages = async (folder = 'menu') => {
  try {
    const folderRef = ref(storage, folder);
    const result    = await listAll(folderRef);
    const urls = await Promise.all(
      result.items.map(async (item) => ({
        url:  await getDownloadURL(item),
        path: item.fullPath,
        name: item.name,
      }))
    );
    return urls;
  } catch (err) {
    console.error('List error:', err);
    return [];
  }
};

// ── Get URL from path ──────────────────────────────────────────────────────
export const getImageUrl = async (path) => {
  try {
    return await getDownloadURL(ref(storage, path));
  } catch {
    return null;
  }
};
