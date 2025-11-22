// src/components/PesticidePage.tsx
// NOTE: sample uploaded image path (use as test URL if needed): /mnt/data/unnamed.jpg

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createLog, getRecentLogs, type PesticideLog } from '../services/pesticideFirestoreService';
import { compressImageToDataUrl } from '../utils/imageCompression';
import { getCurrentUserName } from '../services/userService';
import { Camera } from 'lucide-react';

const PesticidePage: React.FC = () => {
  const { user } = useAuth();

  const [farmerName, setFarmerName] = useState<string>('शेतीकरी');

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
    (async () => {
      try {
        const name = await getCurrentUserName();
        setFarmerName(name || 'शेतीकरी');
      } catch {
        setFarmerName('शेतीकरी');
      }
    })();
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    setIsFetching(true);
    getRecentLogs(10)
      .then(setRecentLogs)
      .catch((e: any) => {
        console.error('getRecentLogs error:', e);
        setMessage(`⚠️ नोंदी घेण्यात अडचण: ${e?.message || e}`);
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
      setMessage('कृपया प्रथम साइन इन करा.');
      return;
    }
    if (!pesticideName.trim()) {
      setMessage('कृपया कीटकनाशकाचे नाव भरा.');
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
            maxBytes: 280 * 1024,
          });

        imageDataUrl = dataUrl;
        setCompressionInfo(
          `संपीडन: ${(bytes / 1024).toFixed(0)} KB, ${width}x${height}, q=${qualityUsed.toFixed(2)}, ${format.replace('image/','')}`
        );

        if (bytes > 900 * 1024) {
          throw new Error('छायाचित्र Firestore दस्तऐवजासाठी जास्त मोठे आहे (सुमारे 1MB मर्यादा). लहान प्रतिमा निवडा.');
        }
      }

      const res = await createLog({
        pesticideName: pesticideName.trim(),
        description: description.trim(),
        imageDataUrl,
      });

      setMessage(`✅ जतन केले: ${res.id}`);
      clearForm();
      setRecentLogs(await getRecentLogs(10));
      setTimeout(() => setMessage(null), 2500);
    } catch (e: any) {
      console.error('createLog error:', e);
      setMessage(`❌ जतन अयशस्वी: ${e?.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6">
      {/* New Log Card */}
      <section className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-5">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
          नवीन कीटकनाशक नोंद <span className="text-gray-400 text-sm">(केवळ Firestore मध्ये)</span>
        </h2>

        {message && (
          <p className={`text-center mb-4 ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pesticide Name */}
          <div>
            <label htmlFor="pesticideName" className="block text-sm font-medium text-gray-700 mb-1">
              कीटकनाशकाचे नाव
            </label>
            <input
              id="pesticideName"
              type="text"
              value={pesticideName}
              onChange={(e) => setPesticideName(e.target.value)}
              placeholder="उदा., इमिडाक्लोप्रिड"
              required
              className="w-full rounded-xl border-2 border-green-200 bg-white px-3 py-2 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              वर्णन / नोंदी
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="उदा., अ‍ॅफिडच्या लक्षणांनंतर लावले. मिक्सिंग: 1ml/L."
              className="w-full rounded-xl border-2 border-green-200 bg-white px-3 py-2 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
          </div>

          {/* Image (Firestore Data URL) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              छायाचित्र (Firestore मध्ये संग्रहित)
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              className="hidden"
              id="image-upload"
            />

            <div className="flex items-center gap-3">
              <label
                htmlFor="image-upload"
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-4 py-2 text-sm font-medium shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <span>प्रतिमा निवडा</span>
              </label>

              <div className="ml-auto flex items-center gap-3 rounded-2xl bg-gray-50 border border-gray-200 px-3 py-2 shadow-sm">
                <div>
                  <div className="text-sm font-medium text-gray-800">शेतीकरी: {farmerName}</div>
                  <div className="text-xs text-gray-500">वापरकर्ता आयडी: {user?.uid || '—'}</div>
                  <div className="text-xs text-gray-500">तारीख: {todayISO}</div>
                </div>
                <div className="flex-none">
                  <div className="rounded-full bg-white shadow p-2 border border-gray-200">
                    <Camera className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="प्रतिमा प्रीव्ह्यू"
                  className="rounded-xl max-h-56 w-auto border border-gray-200 shadow"
                />
              </div>
            )}
            {compressionInfo && <p className="mt-2 text-xs text-gray-500">{compressionInfo}</p>}
          </div>

          {/* Save */}
          <button
            type="submit"
            disabled={!pesticideName.trim() || isLoading}
            className="w-full rounded-xl bg-green-600 text-white font-semibold py-3 shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-60"
          >
            {isLoading ? 'जतन करत आहे…' : 'नोंद जतन करा'}
          </button>
        </form>
      </section>

      {/* Recent Logs */}
      <section className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-800">अलीकच्या नोंदी</h3>
          {isFetching && <span className="text-sm text-gray-500">लोड करत आहे…</span>}
        </div>

        {recentLogs.length > 0 ? (
          <ul className="space-y-3">
            {recentLogs.map((log) => (
              <li
                key={log.id}
                className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm flex items-center gap-3"
              >
                {log.imageDataUrl ? (
                  <img
                    src={log.imageDataUrl}
                    alt={log.pesticideName}
                    className="w-14 h-14 rounded-xl object-cover flex-none border border-gray-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                    प्रतिमा नाही
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 truncate">{log.pesticideName}</div>
                  <div className="text-xs text-gray-500">{log.dateISO}</div>
                  {log.description && (
                    <div className="text-sm text-gray-700 mt-0.5 line-clamp-2">{log.description}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-2">अजून नोंदी नाहीत.</p>
        )}
      </section>
    </div>
  );
};

export default PesticidePage;
