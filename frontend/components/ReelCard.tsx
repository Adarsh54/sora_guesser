'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Send, Sparkles, Loader2, Heart, MessageCircle, Share2, Plus, X } from 'lucide-react';

interface ReelCardProps {
  imageId: string;
  imageUrl: string;
  actualPrompt: string;
  onGuessSubmitted?: () => void;
  isActive: boolean;
  mediaType?: 'image' | 'video';
}

export default function ReelCard({ imageId, imageUrl, actualPrompt, onGuessSubmitted, isActive, mediaType = 'image' }: ReelCardProps) {
  const { publicKey } = useWallet();
  const [guess, setGuess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPrompt, setCreatePrompt] = useState('');
  const [creating, setCreating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  // Auto-play video when active
  useEffect(() => {
    if (mediaType === 'video' && videoRef.current) {
      if (isActive) {
        // Small delay to ensure video is loaded
        const playVideo = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              console.log('Video autoplay failed, user interaction required:', err);
            });
          }
        };
        // Try to play immediately and also after a short delay
        playVideo();
        setTimeout(playVideo, 100);
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive, mediaType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !guess.trim()) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/submit-guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          walletId: publicKey.toString(),
          guessText: guess.trim(),
          actualPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to submit guess');
      }

      const result = await response.json();
      console.log('✅ Guess result:', result);

      // Show success/failure message
      if (result.isCorrect) {
        alert(`🎉 Correct! You earned ${result.tokensEarned} DGEN tokens!\n\nSimilarity: ${result.similarityScore}%${result.minting?.signature ? '\n\nTransaction: ' + result.minting.signature.substring(0, 20) + '...' : ''}`);
      } else {
        alert(`❌ Not quite! Similarity: ${result.similarityScore}%\n\nTry again or scroll to the next challenge!`);
      }

      setGuess('');
      setShowInput(false);
      
      setTimeout(() => {
        onGuessSubmitted?.();
      }, 500);
      
    } catch (error) {
      console.error('Error submitting guess:', error);
      alert('Failed to submit guess. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVideoClick = () => {
    if (mediaType === 'video' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error('Play failed:', err);
        });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleCreateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createPrompt.trim()) return;

    setCreating(true);

    try {
      // Use a more reliable image source with timestamp to avoid caching issues
      const timestamp = Date.now();
      const imageUrl = `https://picsum.photos/1024/1024?random=${timestamp}`;
      
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          prompt: createPrompt.trim(),
          difficulty: 'medium',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create image');
      }

      setCreatePrompt('');
      setShowCreateModal(false);
      
      // Refresh the page to show the new image
      window.location.reload();
      
    } catch (error) {
      console.error('Error creating image:', error);
      alert('Failed to create image. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="reel-card">
      {/* Background Media (Image or Video) */}
      <div 
        className="absolute inset-0 bg-black"
        onClick={mediaType === 'video' ? handleVideoClick : undefined}
      >
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <Loader2 className="w-12 h-12 animate-spin text-white" />
          </div>
        )}
        
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
            <div className="text-center p-8">
              <Sparkles className="w-16 h-16 text-white/70 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{mediaType === 'video' ? 'Video' : 'Image'} Loading Error</h3>
              <p className="text-white/70 text-sm mb-4">Unable to load the {mediaType}</p>
              <button
                onClick={() => {
                  setImageError(false);
                  setImageLoading(true);
                }}
                className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white hover:bg-white/30 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : mediaType === 'video' ? (
          <video
            ref={videoRef}
            src={imageUrl}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            autoPlay={isActive}
            preload="auto"
            onLoadedData={() => {
              setImageLoading(false);
              setImageError(false);
              // Try to play when loaded if this is the active card
              if (isActive && videoRef.current) {
                videoRef.current.play().catch(err => console.log('Autoplay blocked:', err));
              }
            }}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
            onCanPlay={() => {
              // Another attempt to play when video is ready
              if (isActive && videoRef.current) {
                videoRef.current.play()
                  .then(() => setIsPlaying(true))
                  .catch(err => console.log('Autoplay blocked:', err));
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <img
            src={imageUrl}
            alt="AI Generated"
            className="w-full h-full object-cover"
            onLoad={() => {
              setImageLoading(false);
              setImageError(false);
            }}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
        )}
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>

      {/* Top Info */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-16 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">AI Generated</span>
          </div>
          {mediaType === 'video' && (
            <div className="bg-red-600/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-sm font-semibold text-white">🎬 VIDEO</span>
            </div>
          )}
        </div>
      </div>

      {/* Video Play/Pause Overlay */}
      {mediaType === 'video' && !isPlaying && !imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-20 h-20 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-[24px] border-l-white border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent ml-2"></div>
          </div>
        </div>
      )}

      {/* Right Side Actions (Instagram Style) */}
      <div className="absolute right-4 bottom-32 z-10 flex flex-col items-center gap-6">
        <button
          onClick={() => setLiked(!liked)}
          className="flex flex-col items-center gap-1 transition-transform hover:scale-110"
        >
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center">
            <Heart
              className={`w-7 h-7 ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`}
            />
          </div>
          <span className="text-xs font-semibold text-white drop-shadow-lg">
            {liked ? '1.2k' : '1.1k'}
          </span>
        </button>

        <button
          onClick={() => setShowInput(!showInput)}
          className="flex flex-col items-center gap-1 transition-transform hover:scale-110"
        >
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-semibold text-white drop-shadow-lg">Guess</span>
        </button>

        <button className="flex flex-col items-center gap-1 transition-transform hover:scale-110">
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-semibold text-white drop-shadow-lg">Share</span>
        </button>

        <button
        onClick={() => setShowCreateModal(true)}>
          <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-semibold text-white drop-shadow-lg">Create</span>
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 z-10">
        <div className="space-y-3">
          {/* Challenge Prompt */}
          <div>
            <h3 className="text-white font-bold text-lg mb-1 drop-shadow-lg">
              🎯 Guess the AI Prompt
            </h3>
            <p className="text-white/90 text-sm drop-shadow-lg">
              What prompt created this {mediaType}?
            </p>
          </div>

          {/* Input Section */}
          {showInput && (
            <div className="animate-slide-up">
              {!publicKey ? (
                <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-500/50 rounded-2xl p-4 text-center">
                  <p className="text-sm text-yellow-300 font-medium">
                    Connect wallet to submit guesses
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-2">
                  <div className="relative">
                    <textarea
                      ref={inputRef}
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      placeholder="Type your guess..."
                      className="w-full bg-black/60 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-3 pr-12 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none min-h-[80px]"
                      disabled={submitting}
                    />
                    <button
                      type="submit"
                      disabled={submitting || !guess.trim()}
                      className="absolute right-3 bottom-3 w-9 h-9 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-110"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      ) : (
                        <Send className="w-4 h-4 text-white ml-0.5" />
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Image Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md mx-4 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Create New Image</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateImage} className="space-y-4">
              <div>
                <label htmlFor="createPrompt" className="block text-sm font-medium text-white mb-2">
                  Describe your image
                </label>
                <textarea
                  id="createPrompt"
                  value={createPrompt}
                  onChange={(e) => setCreatePrompt(e.target.value)}
                  placeholder="e.g., A beautiful sunset over mountains with flying cars..."
                  className="w-full bg-black/60 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none min-h-[100px]"
                  disabled={creating}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !createPrompt.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

