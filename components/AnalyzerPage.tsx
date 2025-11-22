import React, { useState, useRef } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import { analyzePlantImage } from '../services/geminiService';
import type { ModelResult } from '../types';
import { ErrorBoundary } from './ErrorBoundary.tsx';

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
    {children}
  </span>
);

// Turn any value into safe display text
const textify = (v: any): string => {
  if (v == null) return '—';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    // prefer common fields if provided by model
    if ('description' in v && typeof (v as any).description === 'string') {
      return ('type' in v && (v as any).type)
        ? `${(v as any).type}: ${(v as any).description}`
        : (v as any).description;
    }
    try { return JSON.stringify(v); } catch { return '[object]'; }
  }
  return String(v);
};

const SafeList: React.FC<{ items?: any[] }> = ({ items }) => {
  if (!items || items.length === 0) return <p className="text-gray-500">—</p>;
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((it, idx) => <li key={idx}>{textify(it)}</li>)}
    </ul>
  );
};

const AnalyzerPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ModelResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setAnalysisResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile || !prompt) {
      setError('कृपया फोटो आणि प्रश्न दोन्ही भरा.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await analyzePlantImage(imageFile, prompt);
      setAnalysisResult(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'विश्लेषण करताना अनपेक्षित त्रुटी आली.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStructured = (json: any) => {
    const {
      diagnosis,
      confidence,
      probable_causes,
      severity,
      recommended_actions,
      warnings,
      need_expert,
      metadata
    } = json || {};

    const confPct = typeof confidence === 'number'
      ? Math.round(Math.min(Math.max(confidence, 0), 1) * 100)
      : undefined;

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">निदान</h3>
          {typeof severity === 'string' && <Badge>{`तीव्रता: ${severity}`}</Badge>}
          {typeof need_expert === 'boolean' && need_expert && <Badge>तज्ञ सल्ल्याची शिफारस</Badge>}
          {typeof confPct === 'number' && <Badge>{`विश्वास: ${confPct}%`}</Badge>}
        </div>

        <p className="text-gray-800">{textify(diagnosis)}</p>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">संभाव्य कारणे</h4>
            <SafeList items={probable_causes} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">शिफारस केलेल्या कृती</h4>
            <SafeList items={recommended_actions} />
          </div>
        </div>

        {warnings && warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-semibold text-yellow-900 mb-1">सूचना</h4>
            <SafeList items={warnings} />
          </div>
        )}

        <div className="text-xs text-gray-500">
          <span>
            नोंद वेळ: {metadata?.captured_on ? new Date(metadata.captured_on).toLocaleString() : '—'}
          </span>
          <span className="mx-2">•</span>
          <span>प्रश्न: {metadata?.prompt || '—'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">पीक विश्लेषक (Crop Analyzer)</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              १. पिकाचा फोटो अपलोड करा
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              className="hidden"
              id="analyzer-image-upload"
            />
            <label
              htmlFor="analyzer-image-upload"
              className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              फोटो निवडा
            </label>
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="पिकाचा प्रीव्ह्यू"
                  className="rounded-lg max-h-48 w-auto"
                />
              </div>
            )}
          </div>

          <Input
            label="२. समस्या वर्णन करा किंवा प्रश्न विचारा"
            id="prompt"
            type="text"
            placeholder="उदा., या पानावर कोणता रोग आहे?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
          />

          <Button onClick={handleAnalyze} isLoading={isLoading} disabled={!prompt || !imageFile}>
            पिकाचे विश्लेषण करा
          </Button>
        </div>
      </Card>

      {(isLoading || error || analysisResult) && (
        <Card>
          <h2 className="text-xl font-bold text-gray-800 mb-2">विश्लेषण परिणाम</h2>

          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">
                Gemini कडून विश्लेषण सुरू आहे... कृपया थोडा वेळ थांबा.
              </p>
            </div>
          )}

          {error && <p className="text-red-500 text-center">{error}</p>}

          {!isLoading && !error && analysisResult?.json && (
            <div className="text-gray-700 bg-gray-50 p-4 rounded-md">
              <ErrorBoundary>
                {renderStructured(analysisResult.json)}
              </ErrorBoundary>
            </div>
          )}

          {/* Dev-only: inspect raw
          <pre className="mt-4 text-xs text-gray-500 overflow-auto">{analysisResult?.raw}</pre>
          */}
        </Card>
      )}
    </div>
  );
};

export default AnalyzerPage;
