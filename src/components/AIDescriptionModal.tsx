import React, { useState, useEffect } from 'react';
import { X, Wand2, RefreshCw, Copy, Check, AlertCircle } from 'lucide-react';

interface AIDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productInfo: {
    name: string;
    category: string;
    price: number;
    originalDescription?: string;
    tags?: string[];
  };
  onApply: (description: {
    title: string;
    shortDescription: string;
    fullDescription: string;
    tags: string[];
  }) => void;
}

interface GeneratedDescription {
  title: string;
  shortDescription: string;
  fullDescription: string;
  seoKeywords: string[];
  tags: string[];
}

export const AIDescriptionModal: React.FC<AIDescriptionModalProps> = ({
  isOpen,
  onClose,
  productInfo,
  onApply
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [description, setDescription] = useState<GeneratedDescription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && !description) {
      generateDescription();
    }
  }, [isOpen]);

  const generateDescription = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/ai/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productInfo: {
            name: productInfo.name,
            category: productInfo.category,
            price: productInfo.price,
            originalDescription: productInfo.originalDescription,
            tags: productInfo.tags
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setDescription(data.description);
        if (data.fallback) {
          setError(`AI generation failed: ${data.error}. Using fallback description.`);
        }
      } else {
        setError(data.error || 'Failed to generate description');
      }
    } catch (err) {
      setError('Network error: Could not connect to AI service');
      console.error('AI description generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleApply = () => {
    if (description) {
      onApply({
        title: description.title,
        shortDescription: description.shortDescription,
        fullDescription: description.fullDescription,
        tags: description.tags
      });
      onClose();
    }
  };

  const updateDescription = (field: keyof GeneratedDescription, value: any) => {
    if (description) {
      setDescription({
        ...description,
        [field]: value
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-2xl shadow-premium-lg border border-dark-600 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-dark-600 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-gradient rounded-xl flex items-center justify-center">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AI Product Description</h2>
                <p className="text-gray-400 text-sm mt-1">
                  AI-powered copywriting for "{productInfo.name}"
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/20 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-white font-medium">Generating amazing description...</p>
                <p className="text-gray-400 text-sm mt-1">This usually takes 10-15 seconds</p>
              </div>
            </div>
          )}

          {/* Generated Content */}
          {description && !isGenerating && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={generateDescription}
                    disabled={isGenerating}
                    className="premium-button-secondary flex items-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Regenerate</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="premium-button-secondary"
                  >
                    {isEditing ? 'Preview' : 'Edit'}
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-purple-400 font-medium text-sm">Product Title</label>
                  <button
                    onClick={() => handleCopy(description.title, 'title')}
                    className="p-1 hover:bg-dark-600 rounded transition-colors"
                  >
                    {copied === 'title' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={description.title}
                    onChange={(e) => updateDescription('title', e.target.value)}
                    className="premium-input w-full"
                    maxLength={60}
                  />
                ) : (
                  <p className="text-white font-semibold">{description.title}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{description.title.length}/60 characters</p>
              </div>

              {/* Short Description */}
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-purple-400 font-medium text-sm">Short Description</label>
                  <button
                    onClick={() => handleCopy(description.shortDescription, 'short')}
                    className="p-1 hover:bg-dark-600 rounded transition-colors"
                  >
                    {copied === 'short' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {isEditing ? (
                  <textarea
                    value={description.shortDescription}
                    onChange={(e) => updateDescription('shortDescription', e.target.value)}
                    className="premium-input w-full h-20 resize-none"
                    maxLength={120}
                  />
                ) : (
                  <p className="text-gray-300">{description.shortDescription}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{description.shortDescription.length}/120 characters</p>
              </div>

              {/* Full Description */}
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-purple-400 font-medium text-sm">Full Description</label>
                  <button
                    onClick={() => handleCopy(description.fullDescription, 'full')}
                    className="p-1 hover:bg-dark-600 rounded transition-colors"
                  >
                    {copied === 'full' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {isEditing ? (
                  <textarea
                    value={description.fullDescription}
                    onChange={(e) => updateDescription('fullDescription', e.target.value)}
                    className="premium-input w-full h-40 resize-none"
                  />
                ) : (
                  <div 
                    className="text-gray-300 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: description.fullDescription }}
                  />
                )}
              </div>

              {/* Tags */}
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-purple-400 font-medium text-sm">Tags</label>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={description.tags.join(', ')}
                    onChange={(e) => updateDescription('tags', e.target.value.split(', ').map(t => t.trim()))}
                    className="premium-input w-full"
                    placeholder="tag1, tag2, tag3"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {description.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* SEO Keywords */}
              <div className="bg-dark-700 rounded-lg p-4">
                <label className="text-purple-400 font-medium text-sm mb-2 block">SEO Keywords</label>
                <div className="flex flex-wrap gap-2">
                  {description.seoKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-900/30 text-green-300 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {description && !isGenerating && (
          <div className="p-6 border-t border-dark-600 bg-dark-900/50">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                🎯 AI-optimized for conversions and engagement
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="premium-button-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="premium-button"
                >
                  Apply Description
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 