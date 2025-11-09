'use client';

import { useState } from 'react';
import { X, Image as ImageIcon, Video, Loader2, Sparkles } from 'lucide-react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateModal({ isOpen, onClose, onSuccess }: CreateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Generate and save the media (APIs handle both generation and database saving)
      console.log(`🎨 Generating ${mediaType}...`);
      const generateEndpoint = mediaType === 'image' 
        ? '/api/generate-image-google' 
        : '/api/generate-video-veo';
      
      const generateResponse = await fetch(generateEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          difficulty,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || `Failed to generate ${mediaType}`);
      }

      const generateData = await generateResponse.json();
      
      console.log(`✅ ${mediaType} generated and saved successfully!`);
      console.log('Challenge:', generateData.challenge);
      
      // Reset form
      setPrompt('');
      setMediaType('image');
      setDifficulty('medium');
      
      // Notify parent and close
      onSuccess();
      onClose();
      
    } catch (err: any) {
      console.error('Error creating challenge:', err);
      setError(err.message || 'Failed to create challenge');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Create Challenge</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to generate..."
              disabled={isGenerating}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none disabled:opacity-50"
              rows={4}
              maxLength={500}
            />
            <p className="mt-1 text-xs text-white/40">
              {prompt.length}/500 characters
            </p>
          </div>

          {/* Media Type Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Media Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMediaType('image')}
                disabled={isGenerating}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all disabled:opacity-50 ${
                  mediaType === 'image'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <ImageIcon className="w-8 h-8 text-white" />
                <span className="text-sm font-medium text-white">Image</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaType('video')}
                disabled={isGenerating}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all disabled:opacity-50 ${
                  mediaType === 'video'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <Video className="w-8 h-8 text-white" />
                <span className="text-sm font-medium text-white">Video</span>
              </button>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  disabled={isGenerating}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                    difficulty === level
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating {mediaType}...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Create Challenge</span>
              </>
            )}
          </button>

          {/* Info Text */}
          {isGenerating && (
            <p className="text-center text-sm text-white/60">
              {mediaType === 'video' 
                ? 'This may take 1-2 minutes...' 
                : 'This may take 10-30 seconds...'}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

