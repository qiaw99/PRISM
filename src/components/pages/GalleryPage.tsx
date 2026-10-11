'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { GalleryPageConfig, GalleryPhoto } from '@/types/page';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import TravelMap from '@/components/TravelMap';

const yearColors: Record<string, string> = {
    '2024': '#3b82f6',
    '2025': '#f59e0b',
    '2026': '#8b5cf6',
};

const getYearColor = (year?: string): string => {
    if (!year) return '#9ca3af';
    return yearColors[year] || '#9ca3af';
};

export default function GalleryPage({ config, embedded = false }: { config: GalleryPageConfig; embedded?: boolean }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const photos = config.photos;

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % photos.length);
    }, [photos.length]);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + photos.length) % photos.length);
    }, [photos.length]);

    useEffect(() => {
        if (!isPlaying || lightboxOpen) return;
        const interval = setInterval(nextSlide, 4000);
        return () => clearInterval(interval);
    }, [isPlaying, lightboxOpen, nextSlide]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxOpen) {
                if (e.key === 'Escape') setLightboxOpen(false);
                if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
                if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev + 1) % photos.length);
            } else {
                if (e.key === 'ArrowLeft') prevSlide();
                if (e.key === 'ArrowRight') nextSlide();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, photos.length, prevSlide, nextSlide]);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const groupedByConference = photos.reduce((acc, photo, index) => {
        const key = photo.conference;
        if (!acc[key]) acc[key] = [];
        acc[key].push({ ...photo, originalIndex: index });
        return acc;
    }, {} as Record<string, (GalleryPhoto & { originalIndex: number })[]>);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        >
            <div className={embedded ? "mb-4" : "mb-8"}>
                <h1 className={`${embedded ? "text-2xl" : "text-4xl"} font-serif font-bold text-primary mb-4`}>
                    {config.title}
                </h1>
                {config.description && (
                    <p className={`${embedded ? "text-base" : "text-lg"} text-neutral-600 dark:text-neutral-500 max-w-2xl`}>
                        {config.description}
                    </p>
                )}
            </div>

            {config.intro && (
                <div className="prose prose-neutral dark:prose-invert max-w-none mb-8">
                    <ReactMarkdown>{config.intro}</ReactMarkdown>
                </div>
            )}

            {/* Carousel */}
            <div className="relative mb-12 flex items-center gap-4">
                {/* Left Arrow */}
                <button
                    onClick={prevSlide}
                    className="flex-shrink-0 p-3 rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors shadow-md"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-neutral-700 dark:text-neutral-200" />
                </button>

                {/* Image Container */}
                <div className="flex-grow rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shadow-xl">
                    <div className="aspect-[16/9] relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0 cursor-pointer"
                                onClick={() => openLightbox(currentSlide)}
                            >
                                <Image
                                    src={photos[currentSlide].src}
                                    alt={photos[currentSlide].caption || photos[currentSlide].conference}
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </motion.div>
                        </AnimatePresence>

                        {/* Caption overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                            <p className="text-white text-lg font-medium">
                                {photos[currentSlide].conference}
                                {photos[currentSlide].year && (
                                    <span style={{ color: getYearColor(photos[currentSlide].year) }} className="ml-2 font-semibold">
                                        ({photos[currentSlide].year})
                                    </span>
                                )}
                            </p>
                            {photos[currentSlide].caption && (
                                <p className="text-white/80 text-sm mt-1">{photos[currentSlide].caption}</p>
                            )}
                        </div>

                        {/* Play/Pause */}
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-colors"
                        >
                            {isPlaying ? (
                                <PauseIcon className="w-5 h-5 text-white" />
                            ) : (
                                <PlayIcon className="w-5 h-5 text-white" />
                            )}
                        </button>
                    </div>

                    {/* Dots */}
                    <div className="flex justify-center gap-2 py-4 bg-neutral-50 dark:bg-neutral-900">
                        {photos.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    index === currentSlide
                                        ? 'bg-accent w-6'
                                        : 'bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Arrow */}
                <button
                    onClick={nextSlide}
                    className="flex-shrink-0 p-3 rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors shadow-md"
                >
                    <ChevronRightIcon className="w-6 h-6 text-neutral-700 dark:text-neutral-200" />
                </button>
            </div>

            {/* Travel Map */}
            {config.destinations && config.destinations.length > 0 && (
                <TravelMap destinations={config.destinations} homeCity={config.homeCity} />
            )}

            {/* Gallery Grid by Conference - Two conferences per row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(groupedByConference).map(([conference, conferencePhotos]) => {
                    const year = conferencePhotos[0]?.year;
                    return (
                        <div key={conference} className="space-y-3">
                            <h3 className="text-lg font-serif font-semibold text-primary flex items-center">
                                <span
                                    className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                                    style={{ backgroundColor: getYearColor(year) }}
                                />
                                {conference}
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {conferencePhotos.map((photo) => (
                                    <motion.div
                                        key={photo.originalIndex}
                                        whileHover={{ scale: 1.02 }}
                                        className="aspect-[4/3] relative rounded-lg overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-shadow"
                                        onClick={() => openLightbox(photo.originalIndex)}
                                    >
                                        <Image
                                            src={photo.src}
                                            alt={photo.caption || photo.conference}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <button
                            onClick={() => setLightboxOpen(false)}
                            className="absolute top-4 right-4 p-2 text-white hover:text-neutral-300 z-50"
                        >
                            <XMarkIcon className="w-8 h-8" />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
                            }}
                            className="absolute left-4 p-3 text-white hover:text-neutral-300"
                        >
                            <ChevronLeftIcon className="w-10 h-10" />
                        </button>

                        <div
                            className="relative w-full h-full max-w-6xl max-h-[85vh] m-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={photos[lightboxIndex].src}
                                alt={photos[lightboxIndex].caption || photos[lightboxIndex].conference}
                                fill
                                className="object-contain"
                                priority
                            />
                            <div className="absolute bottom-0 left-0 right-0 text-center p-4 bg-gradient-to-t from-black/50 to-transparent">
                                <p className="text-white text-xl font-medium">
                                    {photos[lightboxIndex].conference}
                                    {photos[lightboxIndex].year && (
                                        <span style={{ color: getYearColor(photos[lightboxIndex].year) }} className="ml-2 font-semibold">
                                            ({photos[lightboxIndex].year})
                                        </span>
                                    )}
                                </p>
                                {photos[lightboxIndex].caption && (
                                    <p className="text-white/80 mt-1">{photos[lightboxIndex].caption}</p>
                                )}
                                <p className="text-white/60 text-sm mt-2">
                                    {lightboxIndex + 1} / {photos.length}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex((prev) => (prev + 1) % photos.length);
                            }}
                            className="absolute right-4 p-3 text-white hover:text-neutral-300"
                        >
                            <ChevronRightIcon className="w-10 h-10" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
