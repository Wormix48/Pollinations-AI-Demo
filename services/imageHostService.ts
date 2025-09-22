import type { UploadedImage } from '../types';

const IMGBB_API_KEY = 'bc146f05484f8a6e4508e105e205b4f4';

/**
 * Uploads a file to ImgBB.
 * @param file The image file to upload.
 * @returns A promise that resolves to an UploadedImage object with URL and delete URL.
 */
export const uploadImage = async (file: File): Promise<UploadedImage> => {
    if (!file.type.startsWith('image/')) {
        throw new Error('File is not an image.');
    }

    const MAX_FILE_SIZE_MB = 10;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`File "${file.name}" is too large (max ${MAX_FILE_SIZE_MB}MB).`);
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json();

    if (response.ok && data.success) {
        const imageUrl = (data.data.url as string).replace(/\.jpeg$/, '.jpg');
        return { url: imageUrl, deleteUrl: data.data.delete_url };
    } else {
        const errorMessage = data?.error?.message || `HTTP error ${response.status}`;
        throw new Error(`Upload failed for "${file.name}": ${errorMessage}`);
    }
};


/**
 * Deletes an image from ImgBB using the provided delete URL.
 * This uses a reverse-engineered method as the standard delete link is not a simple API call.
 * @param image The image object containing the deleteUrl.
 * @returns A promise that resolves when the deletion is attempted.
 */
export const deleteImage = async (image: UploadedImage): Promise<void> => {
    if (!image.deleteUrl) {
        console.warn('No delete URL found for image, skipping deletion:', image.url);
        return;
    }

    try {
        const url = new URL(image.deleteUrl); // e.g., https://ibb.co/$image_id/$image_hash
        const pathParts = url.pathname.split('/').filter(Boolean);
        
        if (pathParts.length < 2) {
            throw new Error(`Invalid ImgBB delete URL format: ${image.deleteUrl}`);
        }
        
        const imageId = pathParts[0];
        const imageHash = pathParts[1];

        const formData = new FormData();
        formData.append('pathname', `/${imageId}/${imageHash}`);
        formData.append('action', 'delete');
        formData.append('delete', 'image');
        formData.append('from', 'resource');
        formData.append('deleting[id]', imageId);
        formData.append('deleting[hash]', imageHash);

        const response = await fetch('https://ibb.co/json', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => `HTTP Status ${response.status}`);
            throw new Error(`Failed to delete image. Server responded with: ${errorText}`);
        }

        const result = await response.json();

        // Based on observation, a successful response has status_code 200.
        if (result?.status_code !== 200) {
            throw new Error(`ImgBB API indicated an error: ${result?.status_txt || 'Unknown error'}`);
        }

        console.log('Successfully deleted image from ImgBB:', image.url);

    } catch (error) {
        console.error('Error deleting image from ImgBB:', error);
        // Re-throw the error so the caller can be aware, though UI might swallow it.
        throw error;
    }
};