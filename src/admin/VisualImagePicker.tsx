import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Image as ImageIcon,
  UploadCloud,
  Check,
  X,
  Search,
  Copy,
  ExternalLink,
  Trash2,
  FolderOpen,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { ImagePreset } from '../core/types';
import { useStudio } from './StudioContext';

type ImagePresetItem = ImagePreset;

interface VisualImagePickerProps {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
  fieldId?: string;
  autoOpen?: boolean;
  onClose?: () => void;
}

export const VisualImagePicker: React.FC<VisualImagePickerProps> = ({
  value,
  onChange,
  label,
  fieldId,
  autoOpen = false,
  onClose,
}) => {
  const { config } = useStudio();
  const adapter = config.adapter;
  const presets = config.imagePresets ?? [];
  const CATEGORY_TABS = useMemo(() => {
    const tabs = [{ id: 'all', label: 'All Photos' }];
    if (adapter.listMedia || adapter.uploadMedia) tabs.push({ id: 'uploaded', label: 'Uploaded' });
    if (config.imagePresetCategories) {
      tabs.push(...config.imagePresetCategories.filter((c) => c.id !== 'all' && c.id !== 'uploaded'));
    } else {
      for (const category of Array.from(new Set(presets.map((p) => p.category)))) {
        if (category !== 'uploaded') tabs.push({ id: category, label: category });
      }
    }
    return tabs;
  }, [adapter, config.imagePresetCategories, presets]);
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string>(value || '');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [backendMedia, setBackendMedia] = useState<ImagePresetItem[]>([]);
  const [isLoadingBackendMedia, setIsLoadingBackendMedia] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync internal selected photo when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPhoto(value || '');
      setCustomUrlInput(value?.startsWith('http') ? value : '');
      fetchBackendMedia();
    }
  }, [isOpen, value]);

  // Load media already uploaded through the storage adapter
  const fetchBackendMedia = async () => {
    if (!adapter.listMedia) return;
    try {
      setIsLoadingBackendMedia(true);
      const res = await adapter.listMedia();
      setBackendMedia(
        res
          .filter((item) => item.url)
          .map((item) => ({
            url: item.url,
            title: item.name || 'Uploaded Image',
            category: 'uploaded',
            tag: 'Uploaded',
          }))
      );
    } catch {
      // Non-blocking: presets stay available
    } finally {
      setIsLoadingBackendMedia(false);
    }
  };

  // Combine built-in presets and backend uploaded media
  const allAvailablePhotos = useMemo(() => {
    const combined = [...backendMedia, ...presets];
    // Remove duplicate URLs
    const seen = new Set<string>();
    return combined.filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
  }, [backendMedia, presets]);

  // Filter photos by category and search term
  const filteredPhotos = useMemo(() => {
    return allAvailablePhotos.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.tag && item.tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [allAvailablePhotos, selectedCategory, searchQuery]);

  // Handle direct file upload from PC (Supports multiple files)
  const handleFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      toast.error('Please upload image files (PNG, JPG, SVG, WebP, GIF)');
      return;
    }

    try {
      setIsUploading(true);
      if (!adapter.uploadMedia) {
        throw new Error('Storage adapter has no uploadMedia');
      }
      const items = await adapter.uploadMedia(fileArray);

      if (items.length > 0) {
        // Add to uploaded media list
        const newUploadedItems: ImagePresetItem[] = items.map((it) => ({
          url: it.url,
          title: it.name,
          category: 'uploaded',
          tag: 'Uploaded',
        }));

        setBackendMedia((prev) => [...newUploadedItems, ...prev]);
        setSelectedPhoto(items[0].url);
        // Go back to the gallery, filtered to uploads, so the editor sees the new photo selected.
        setSearchQuery('');
        setSelectedCategory('uploaded');
        setActiveTab('presets');
        toast.success(`Successfully uploaded ${items.length} image(s)!`);
        return;
      }
    } catch {
      // Fallback: Read locally via Data URL for instant usability
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setSelectedPhoto(result);
          toast.success('Image loaded locally!');
        }
      };
      reader.readAsDataURL(fileArray[0]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Image path copied to clipboard');
  };

  const closeModal = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleApply = () => {
    const finalUrl = activeTab === 'url' ? customUrlInput.trim() : selectedPhoto;
    onChange(finalUrl);
    closeModal();
    toast.success('Image updated!');
  };

  const handleClear = () => {
    onChange('');
    setSelectedPhoto('');
    toast.success('Image removed');
  };

  const modalContent = isOpen ? (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Visual Image Selector</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/40">
                  SaaS CMS Studio
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Preview, search, and click to select any photo or logo for{' '}
                <span className="text-purple-300 font-mono">{label || fieldId || 'this field'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'presets'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Media Library & Presets</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-200">
              {allAvailablePhotos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload From Computer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'url'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>External URL</span>
          </button>
        </div>

        {/* Tab 1: Presets & Library Gallery */}
        {activeTab === 'presets' && (
          <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search photo by name or tag (e.g. logo, teacher, slider, template)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-750 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isLoadingBackendMedia && (
                <div className="flex items-center gap-1.5 text-xs text-purple-400 shrink-0">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing media...</span>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`text-xs px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedCategory === tab.id
                      ? 'bg-purple-900/60 text-purple-200 border border-purple-500/50'
                      : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Photo Grid */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {filteredPhotos.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl">
                  <ImageIcon className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No photos match your filter</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try searching for another keyword or switch category.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pb-2">
                  {filteredPhotos.map((photo) => {
                    const isSelected = selectedPhoto === photo.url;
                    return (
                      <div
                        key={photo.url}
                        onClick={() => setSelectedPhoto(photo.url)}
                        onDoubleClick={() => {
                          setSelectedPhoto(photo.url);
                          onChange(photo.url);
                          setIsOpen(false);
                          toast.success('Image selected!');
                        }}
                        className={`group relative rounded-xl border p-2 flex flex-col cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/50 shadow-lg shadow-purple-950/50'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950/90'
                        }`}
                      >
                        {/* Photo Container */}
                        <div className="relative w-full aspect-video rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-center justify-center overflow-hidden mb-2">
                          <img
                            src={photo.url}
                            alt={photo.title}
                            className="w-full h-full object-contain p-1.5 transition-transform duration-200 group-hover:scale-105"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="gray" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
                            }}
                          />

                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-purple-300 transition-colors">
                            {photo.title}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                              {photo.url}
                            </span>
                            {photo.tag && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                                {photo.tag}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Upload Direct */}
        {activeTab === 'upload' && (
          <div className="flex-1 p-8 flex flex-col items-center justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) handleFilesUpload(files);
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const files = e.dataTransfer.files;
                if (files && files.length > 0) handleFilesUpload(files);
              }}
              className="w-full max-w-lg p-10 border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-3xl bg-slate-950/50 hover:bg-purple-950/10 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <UploadCloud className="w-8 h-8" />
                )}
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                {isUploading ? 'Uploading Images...' : 'Click or Drag & Drop Multiple Photos Here'}
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                Supports single or multiple uploads (PNG, JPG, WebP, SVG, GIF). All uploaded photos appear in your Media Library.
              </p>
              <span className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-colors">
                Browse from Computer (Select Multiple)
              </span>
            </div>

            {selectedPhoto && (
              <div className="mt-6 flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-xs text-slate-400">Selected photo:</span>
                <span className="text-xs font-mono text-purple-300 truncate max-w-md">
                  {selectedPhoto}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Custom URL */}
        {activeTab === 'url' && (
          <div className="flex-1 p-8 max-w-xl mx-auto w-full flex flex-col justify-center space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                External Image URL (CDN / Cloudinary / S3 / Web)
              </label>
              <input
                type="url"
                placeholder="https://example.com/images/my-photo.jpg"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="w-full text-xs p-3.5 rounded-xl bg-slate-950/80 border border-slate-750 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[11px] text-slate-400">
                Paste any public image link. Make sure the link is publicly accessible via HTTPS.
              </p>
            </div>

            {customUrlInput && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300">Live Preview:</span>
                <div className="w-full h-40 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                  <img
                    src={customUrlInput}
                    alt="URL Preview"
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).alt = 'Invalid or unreachable image URL';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-slate-400">Selected:</span>
            <span className="text-xs font-mono text-purple-300 truncate max-w-[280px]">
              {activeTab === 'url' ? customUrlInput || 'None' : selectedPhoto || 'None'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={activeTab === 'url' ? !customUrlInput.trim() : !selectedPhoto}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-semibold transition-all shadow-md shadow-purple-900/30"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Use Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <label className="text-xs font-semibold text-slate-300 capitalize flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
          <span>{label?.replace(/([A-Z])/g, ' $1') || 'Image'}</span>
        </label>
        {fieldId && <span className="text-[10px] font-mono text-slate-500">{fieldId}</span>}
      </div>

      {/* Inline Picker Trigger - Clean Full-Width Responsive Card */}
      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 flex items-center justify-between gap-3 w-full">
        {/* Left: Thumbnail & Path */}
        <div
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
          title="Click to change image"
        >
          {/* Thumbnail preview */}
          <div className="w-10 h-10 rounded-lg bg-purple-950/60 border border-purple-800/50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:border-purple-500 transition-colors">
            {value ? (
              <img
                src={value}
                alt={label || 'Thumbnail'}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-purple-400/70" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className={`text-xs font-semibold font-mono truncate ${value ? 'text-white' : 'text-slate-500 italic'}`}>
              {value || 'No image selected'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {value ? 'Click to replace or preview' : 'Click to select from media presets'}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <>
              <button
                type="button"
                onClick={() => handleCopy(value)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Copy Image Path"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Remove Image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-all shrink-0"
          >
            {value ? 'Change Image' : 'Select Image'}
          </button>
        </div>
      </div>

      {/* Render Modal via createPortal to body to prevent clipping inside sidebar */}
      {mounted && typeof document !== 'undefined' && modalContent && createPortal(modalContent, document.body)}
    </div>
  );
};
