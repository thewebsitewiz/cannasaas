import { useState, useRef } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Props {
  productId: string;
  currentUrl?: string;
  onUploaded?: (url: string) => void;
}

export function ImageUpload({ productId, currentUrl, onUploaded }: Props) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || '');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, or WebP allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Max file size is 5MB');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(API_URL + '/v1/images/product/' + productId, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'x-dispensary-id': user?.dispensaryId || '',
          'x-organization-id': user?.organizationId || '',
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setPreview(data.thumbnailUrl || data.url);
        onUploaded?.(data.url);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await fetch(API_URL + '/v1/images/product/' + productId, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
          'x-dispensary-id': user?.dispensaryId || '',
          'x-organization-id': user?.organizationId || '',
        },
      });
      setPreview('');
      onUploaded?.('');
    } catch {}
  };

  return (
    <div className="space-y-2">
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />

      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="Product" className="w-32 h-32 object-cover rounded-lg border border-gray-200" />
          <button onClick={handleRemove} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
            <X size={12} />
          </button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand-400 hover:text-brand-600 transition-colors">
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <><Upload size={20} /><span className="text-xs">Upload</span></>}
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
