'use client';

import { useState, useEffect, useRef } from 'react';
import ReelCard from '@/components/ReelCard';
import CreateModal from '@/components/CreateModal';
import { Loader2, Menu, User, TrendingUp, Wallet, Copy, Check, LogOut, LogIn, RefreshCw, Plus } from 'lucide-react';
import TokenBalance from '@/components/TokenBalance';
import GameStats from '@/components/GameStats';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

interface Image {
  id: string;
  image_url: string;
  prompt: string;
  difficulty?: string;
  media_type?: 'image' | 'video';
}

export default function Home() {
  const { publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch images from Supabase
  const fetchImages = async () => {
    try {
      console.log('🔍 Fetching media from API...');
      const response = await fetch('/api/images?limit=20');
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Received data:', data);
        console.log('📊 Number of items:', data.images?.length || 0);
        
        if (data.images && data.images.length > 0) {
          console.log('🎬 First item type:', data.images[0].media_type);
          console.log('🔗 First item URL:', data.images[0].image_url);
        }
        
        setImages(data.images || []);
      } else {
        console.error('❌ Response not OK:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch images on mount
  useEffect(() => {
    fetchImages();
  }, []);

  // Handle scroll to update current index
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const windowHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / windowHeight);
      setCurrentIndex(newIndex);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const hasImages = images.length > 0;

  const scrollToNext = () => {
    if (containerRef.current && currentIndex < images.length - 1) {
      containerRef.current.scrollTo({
        top: (currentIndex + 1) * window.innerHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleGuessSubmitted = () => {
    setTimeout(() => {
      scrollToNext();
    }, 500);
  };

  const copyWalletAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setShowMenu(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const handleConnect = () => {
    setVisible(true);
    setShowMenu(false);
  };

  const handleCreateSuccess = () => {
    // Refetch images to show the new challenge
    fetchImages();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-white" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Reels...</h2>
          <p className="text-white/70">Fetching challenges</p>
        </div>
      </div>
    );
  }

  // If no images, show a helpful message
  if (!hasImages) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black p-6">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-bold text-white mb-4">No Images Yet!</h2>
          <p className="text-white/70 mb-6">
            Generate images or videos to start playing!
          </p>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl text-left border border-white/20">
            <p className="text-sm text-white/70 mb-2">Generate images:</p>
            <code className="text-sm text-purple-400 block mb-4">
              npm run generate:images -- --count=5
            </code>
            <p className="text-sm text-white/70 mb-2">Generate videos:</p>
            <code className="text-sm text-purple-400 block">
              npm run generate:videos -- --count=2
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white drop-shadow-lg">dgenerate</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/60 transition-colors">
            <TrendingUp className="w-5 h-5 text-white" />
          </button>
          <button className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/60 transition-colors">
            <User className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Reel Container */}
      <div
        ref={containerRef}
        className="reel-container"
      >
        {images.map((image, index) => (
          <ReelCard
            key={`${image.id}-${index}`}
            imageId={image.id}
            imageUrl={image.image_url}
            actualPrompt={image.prompt}
            onGuessSubmitted={handleGuessSubmitted}
            isActive={index === currentIndex}
            mediaType={image.media_type || 'image'}
          />
        ))}
      </div>

      {/* Side Menu Overlay */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-50 bg-black/90"
          onClick={() => setShowMenu(false)}
        >
          <div 
            className="fixed left-0 top-0 bottom-0 w-80 bg-black overflow-y-auto animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">Profile</h2>
              <button 
                onClick={() => setShowMenu(false)}
                className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Wallet Info Section */}
            <div className="px-6 py-6 border-b border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Wallet</h3>
              </div>
              
              {publicKey ? (
                <div className="space-y-3">
                  {/* Wallet Address Card */}
                  <div 
                    onClick={copyWalletAddress}
                    className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-mono text-white">{truncateAddress(publicKey.toString())}</p>
                        <p className="text-xs text-white/50">Tap to copy</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/70" />
                      )}
                    </button>
                  </div>

                  {/* Wallet Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={handleConnect}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <RefreshCw className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Change Wallet</p>
                        <p className="text-xs text-white/50">Connect a different wallet</p>
                      </div>
                    </button>

                    <button
                      onClick={handleDisconnect}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-red-500/20 transition-colors text-left group"
                    >
                      <LogOut className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-red-400 transition-colors">Disconnect</p>
                        <p className="text-xs text-white/50">Log out of your wallet</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  <LogIn className="w-5 h-5 text-white" />
                  <span className="text-base font-semibold text-white">Connect Wallet</span>
                </button>
              )}
            </div>

            {/* Token Balance Section */}
            <div className="px-6 py-6 border-b border-white/10">
              <TokenBalance />
            </div>

            {/* Stats Section */}
            <div className="px-6 py-6">
              <GameStats />
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 px-6 py-6 border-t border-white/10">
              <p className="text-sm text-white/40 text-center">
                Built on Solana
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Create Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-6 z-40 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
      >
        <Plus className="w-8 h-8 text-white" />
      </button>

      {/* Create Modal */}
      <CreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
