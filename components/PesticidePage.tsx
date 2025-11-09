import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import { createLog, getRecentLogs, type PesticideLog } from '../services/pesticideFirestoreService';
import { compressImageToDataUrl } from '../utils/imageCompression';

const PesticidePage: React.FC = () => {
  const { user } = useAuth();

  const [pesticideName, setPesticideName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<PesticideLog[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setIsFetching(true);
    getRecentLogs(10)
      .then(setRecentLogs)
      .catch((e: any) => {
        console.error('getRecentLogs error:', e);
        setMessage(`⚠️ Could not fetch logs: ${e?.message || e}`);
      })
      .finally(() => setIsFetching(false));
  }, [user?.uid]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setImageFile(f);
    setCompressionInfo(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(f ? URL.createObjectURL(f) : null);
  };

  const clearForm = () => {
    setPesticideName('');
    setDescription('');
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setCompressionInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setMessage('Please sign in first.');
      return;
    }
    if (!pesticideName.trim()) {
      setMessage('Please enter pesticide name.');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      let imageDataUrl: string | undefined;

      if (imageFile) {
        const { dataUrl, bytes, width, height, qualityUsed, format } =
          await compressImageToDataUrl(imageFile, {
            maxWidth: 1024,
            maxHeight: 1024,
            quality: 0.7,
            minQuality: 0.4,
            targetFormat: 'image/webp',
            maxBytes: 280 * 1024, // ~280 KB
          });

        imageDataUrl = dataUrl;
        setCompressionInfo(
          `Compressed to ${(bytes / 1024).toFixed(0)} KB, ${width}x${height}, q=${qualityUsed.toFixed(2)}, ${format.replace('image/','')}`
        );

        // Guardrail for Firestore doc size
        if (bytes > 900 * 1024) {
          throw new Error('Image still too large for Firestore document (limit ~1MB). Pick a smaller image.');
        }
      }

      const res = await createLog({
        pesticideName: pesticideName.trim(),
        description: description.trim(),
        imageDataUrl,
      });

      setMessage(`✅ Saved: ${res.id}`);
      clearForm();
      setRecentLogs(await getRecentLogs(10));
      setTimeout(() => setMessage(null), 2500);
    } catch (e: any) {
      console.error('createLog error:', e);
      setMessage(`❌ Save failed: ${e?.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">New Pesticide Log (Firestore only)</h2>
        {message && (
          <p className={`text-center mb-4 ${message.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Pesticide Name"
            id="pesticideName"
            type="text"
            value={pesticideName}
            onChange={(e) => setPesticideName(e.target.value)}
            placeholder="e.g., Imidacloprid"
            required
          />

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description / Notes
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Applied after signs of aphids. Dilution 1ml/L."
            />
          </div>

          {/* Image (stored as Data URL in Firestore) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo (stored in Firestore)</label>
            <div className="mt-1 flex items-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Select Image
              </label>
            </div>
            {imagePreview && (
              <div className="mt-4">
                <img src={imagePreview} alt="Preview" className="rounded-lg max-h-48 w-auto" />
              </div>
            )}
            {compressionInfo && (
              <p className="mt-2 text-xs text-gray-500">{compressionInfo}</p>
            )}
          </div>

          <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-700">
            <p><strong>Farmer:</strong> {user?.displayName || '—'}</p>
            <p><strong>User ID:</strong> {user?.uid || '—'}</p>
            <p><strong>Date:</strong> {new Date().toISOString().slice(0, 10)}</p>
          </div>

          <Button type="submit" isLoading={isLoading} disabled={!pesticideName.trim()}>
            Save Log
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Recent Logs</h2>
          {isFetching && <span className="text-sm text-gray-500">Loading…</span>}
        </div>

        {recentLogs.length > 0 ? (
          <ul className="space-y-4">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-start gap-4 border-b pb-3 last:border-0">
                {log.imageDataUrl ? (
                  <img
                    src={log.imageDataUrl}
                    alt={log.pesticideName}
                    className="w-16 h-16 rounded-md object-cover flex-none"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-md bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                    No image
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold truncate">{log.pesticideName}</div>
                  <div className="text-sm text-gray-500">{log.dateISO}</div>
                  {log.description && (
                    <div className="text-sm text-gray-700 mt-1 line-clamp-2">{log.description}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">No logs yet.</p>
        )}
      </Card>
    </div>
  );
};

export default PesticidePage;
