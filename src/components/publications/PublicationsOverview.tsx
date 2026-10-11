'use client';

import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
    DocumentTextIcon,
    UserIcon,
    AcademicCapIcon,
    GlobeAltIcon,
    SparklesIcon,
    ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { Publication } from '@/types/publication';

interface ScholarStats {
    citations: number;
    h_index: number;
    i10_index: number;
    profile_url?: string;
}

interface PublicationsOverviewProps {
    publications: Publication[];
    scholar?: ScholarStats;
    onVenueFilter?: (venue: string | null) => void;
    onYearFilter?: (year: number | null) => void;
    onTopicFilter?: (topic: string | null) => void;
    onCardFilter?: (card: 'firstAuthor' | 'conference' | 'workshop' | 'inSubmission' | null) => void;
    onResetAll?: () => void;
    selectedYear?: number | 'all';
    selectedTopic?: string | 'all';
    selectedVenue?: string | null;
    selectedCard?: 'firstAuthor' | 'conference' | 'workshop' | 'inSubmission' | null;
}

const topicConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    'counterfactual': { label: 'Counterfactual', color: '#3b82f6', bgColor: 'bg-blue-500' },
    'conversational-xai': { label: 'Conversational XAI', color: '#8b5cf6', bgColor: 'bg-purple-500' },
    'faithfulness': { label: 'Faithfulness', color: '#22c55e', bgColor: 'bg-green-500' },
    'interpretability': { label: 'Interpretability', color: '#f97316', bgColor: 'bg-orange-500' },
    'multilingual': { label: 'Multilingual', color: '#ec4899', bgColor: 'bg-pink-500' },
    'rag': { label: 'RAG', color: '#06b6d4', bgColor: 'bg-cyan-500' },
    'rationale': { label: 'Rationale', color: '#14b8a6', bgColor: 'bg-teal-500' },
    'misc': { label: 'Misc', color: '#6b7280', bgColor: 'bg-gray-500' },
};

export default function PublicationsOverview({ publications, scholar, onVenueFilter, onYearFilter, onTopicFilter, onCardFilter, onResetAll, selectedYear, selectedTopic, selectedVenue, selectedCard }: PublicationsOverviewProps) {
    // Helper functions for filtering
    const isFirstAuthorPub = useCallback((pub: Publication): boolean => {
        if (!pub.authors || pub.authors.length === 0) return false;
        if (pub.authors[0].isHighlighted) return true;
        if (pub.authors.length >= 2 && pub.authors[1].isHighlighted) {
            const desc = pub.description?.toLowerCase() || '';
            return desc.includes('equal contribution') || desc.includes('co-first');
        }
        return false;
    }, []);

    const isWorkshopPub = useCallback((pub: Publication): boolean => {
        const venue = (pub.conference || pub.journal || '').toUpperCase();
        return venue.includes('@') || venue.includes('WORKSHOP');
    }, []);

    const isConferencePub = useCallback((pub: Publication): boolean => {
        return pub.type === 'conference' && !isWorkshopPub(pub);
    }, [isWorkshopPub]);

    const isInSubmissionPub = useCallback((pub: Publication): boolean => {
        const desc = pub.description?.toLowerCase() || '';
        return desc.includes('in submission') || desc.includes('under review');
    }, []);

    // Filter publications based on selected card
    const cardFilteredPubs = useMemo(() => {
        if (!selectedCard) return publications;
        switch (selectedCard) {
            case 'firstAuthor': return publications.filter(isFirstAuthorPub);
            case 'conference': return publications.filter(isConferencePub);
            case 'workshop': return publications.filter(isWorkshopPub);
            case 'inSubmission': return publications.filter(isInSubmissionPub);
            default: return publications;
        }
    }, [publications, selectedCard, isFirstAuthorPub, isConferencePub, isWorkshopPub, isInSubmissionPub]);

    const stats = useMemo(() => {
        const firstAuthorCount = publications.filter(pub => {
            if (!pub.authors || pub.authors.length === 0) return false;
            if (pub.authors[0].isHighlighted) return true;
            if (pub.authors.length >= 2 && pub.authors[1].isHighlighted) {
                const desc = pub.description?.toLowerCase() || '';
                return desc.includes('equal contribution') || desc.includes('co-first');
            }
            return false;
        }).length;

        const isWorkshopPaper = (p: Publication): boolean => {
            const venue = (p.conference || p.journal || '').toUpperCase();
            return venue.includes('@') || venue.includes('WORKSHOP');
        };

        const workshopCount = publications.filter(isWorkshopPaper).length;
        const conferenceCount = publications.filter(p => p.type === 'conference' && !isWorkshopPaper(p)).length;
        const inSubmissionCount = publications.filter(p =>
            p.description?.toLowerCase().includes('in submission') ||
            p.description?.toLowerCase().includes('under review')
        ).length;

        // Order matters: longer names first to avoid substring matching (NAACL before ACL)
        const knownVenues = ['EMNLP', 'NAACL', 'COLING', 'EACL', 'AACL', 'IJCNLP', 'INLG', 'TACL', 'ACL', 'CL', 'ARR'];

        const isWorkshopVenue = (venue: string): boolean => {
            const upper = venue.toUpperCase();
            return upper.includes('@') || upper.includes('WORKSHOP');
        };

        const extractVenue = (venue: string): string | null => {
            const upper = venue.toUpperCase();
            if (isWorkshopVenue(venue)) {
                return 'Workshop';
            }
            for (const v of knownVenues) {
                const regex = new RegExp(`\\b${v}\\b`);
                if (regex.test(upper)) return v;
            }
            return null;
        };

        // Filter by card + venue + topic for year counts
        let yearFilteredPubs = cardFilteredPubs;
        if (selectedVenue) {
            yearFilteredPubs = yearFilteredPubs.filter(p => {
                const venue = p.conference || p.journal || '';
                return extractVenue(venue) === selectedVenue;
            });
        }
        if (selectedTopic && selectedTopic !== 'all') {
            yearFilteredPubs = yearFilteredPubs.filter(p => p.topics?.includes(selectedTopic as never));
        }

        const yearCounts: Record<number, number> = {};
        yearFilteredPubs.forEach(p => {
            yearCounts[p.year] = (yearCounts[p.year] || 0) + 1;
        });

        // Filter by card + venue + year for topic counts
        let topicFilteredPubs = yearFilteredPubs;
        if (selectedYear && selectedYear !== 'all') {
            topicFilteredPubs = yearFilteredPubs.filter(p => p.year === selectedYear);
        }

        const topicCounts: Record<string, number> = {};
        topicFilteredPubs.forEach(p => {
            p.topics?.forEach(topic => {
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            });
        });

        // Filter by card + year + topic for venue counts
        let venueFilteredPubs = cardFilteredPubs;
        if (selectedYear && selectedYear !== 'all') {
            venueFilteredPubs = venueFilteredPubs.filter(p => p.year === selectedYear);
        }
        if (selectedTopic && selectedTopic !== 'all') {
            venueFilteredPubs = venueFilteredPubs.filter(p => p.topics?.includes(selectedTopic as never));
        }

        const venueCounts: Record<string, number> = {};
        venueFilteredPubs.forEach(p => {
            const venue = p.conference || p.journal || '';
            const mainVenue = extractVenue(venue);
            if (mainVenue) {
                venueCounts[mainVenue] = (venueCounts[mainVenue] || 0) + 1;
            }
        });

        return {
            total: publications.length,
            firstAuthor: firstAuthorCount,
            conference: conferenceCount,
            workshop: workshopCount,
            inSubmission: inSubmissionCount,
            byYear: yearCounts,
            byTopic: topicCounts,
            byVenue: venueCounts,
        };
    }, [publications, selectedYear, selectedTopic, selectedVenue, cardFilteredPubs]);

    const years = Object.keys(stats.byYear).map(Number).sort();
    const maxYearCount = Math.max(...Object.values(stats.byYear));

    const sortedTopics = Object.entries(stats.byTopic)
        .sort((a, b) => b[1] - a[1]);
    const maxTopicCount = Math.max(...Object.values(stats.byTopic));

    // CCF ranking order (A > B > C), Workshop last
    const venueRank: Record<string, number> = {
        'ACL': 1, 'EMNLP': 1, 'NAACL': 1,
        'COLING': 2, 'EACL': 2, 'TACL': 2,
        'INLG': 3, 'AACL': 3, 'IJCNLP': 3, 'CL': 3, 'ARR': 3,
        'Workshop': 99,
    };

    const sortedVenues = Object.entries(stats.byVenue)
        .sort((a, b) => {
            const rankA = venueRank[a[0]] ?? 50;
            const rankB = venueRank[b[0]] ?? 50;
            if (rankA !== rankB) return rankA - rankB;
            return b[1] - a[1]; // Same rank: sort by count
        })
        .slice(0, 10);

    return (
        <div className="mb-8 space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => onResetAll?.()}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg cursor-pointer hover:scale-105 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-xs font-medium">Total Papers</p>
                            <p className="text-3xl font-bold mt-1">{stats.total}</p>
                        </div>
                        <DocumentTextIcon className="w-10 h-10 text-blue-200 opacity-80" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    onClick={() => onCardFilter?.(selectedCard === 'firstAuthor' ? null : 'firstAuthor')}
                    className={`bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg cursor-pointer transition-all ${selectedCard === 'firstAuthor' ? 'ring-4 ring-white ring-offset-2 ring-offset-emerald-500' : 'hover:scale-105'}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-100 text-xs font-medium">First Author</p>
                            <p className="text-3xl font-bold mt-1">{stats.firstAuthor}</p>
                        </div>
                        <UserIcon className="w-10 h-10 text-emerald-200 opacity-80" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => onCardFilter?.(selectedCard === 'conference' ? null : 'conference')}
                    className={`bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg cursor-pointer transition-all ${selectedCard === 'conference' ? 'ring-4 ring-white ring-offset-2 ring-offset-purple-500' : 'hover:scale-105'}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-xs font-medium">Conferences</p>
                            <p className="text-3xl font-bold mt-1">{stats.conference}</p>
                        </div>
                        <AcademicCapIcon className="w-10 h-10 text-purple-200 opacity-80" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    onClick={() => onCardFilter?.(selectedCard === 'workshop' ? null : 'workshop')}
                    className={`bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg cursor-pointer transition-all ${selectedCard === 'workshop' ? 'ring-4 ring-white ring-offset-2 ring-offset-amber-500' : 'hover:scale-105'}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-100 text-xs font-medium">Workshops</p>
                            <p className="text-3xl font-bold mt-1">{stats.workshop}</p>
                        </div>
                        <GlobeAltIcon className="w-10 h-10 text-amber-200 opacity-80" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => onCardFilter?.(selectedCard === 'inSubmission' ? null : 'inSubmission')}
                    className={`bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-4 text-white shadow-lg cursor-pointer transition-all ${selectedCard === 'inSubmission' ? 'ring-4 ring-white ring-offset-2 ring-offset-rose-500' : 'hover:scale-105'}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-rose-100 text-xs font-medium">In Submission</p>
                            <p className="text-3xl font-bold mt-1">{stats.inSubmission}</p>
                        </div>
                        <SparklesIcon className="w-10 h-10 text-rose-200 opacity-80" />
                    </div>
                </motion.div>
            </div>

            {/* Google Scholar Stats */}
            {scholar && (scholar.citations > 0 || scholar.h_index > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-3 border border-neutral-200 dark:border-neutral-800 shadow-sm"
                >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <Image src="/google-scholar.svg" alt="Google Scholar" width={20} height={20} className="w-5 h-5" />
                            <span className="font-semibold text-sm text-primary">Google Scholar</span>
                            {scholar.profile_url && (
                                <a
                                    href={scholar.profile_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent hover:underline text-xs flex items-center gap-1"
                                >
                                    View <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{scholar.citations}</p>
                                <p className="text-xs text-neutral-500">Citations</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{scholar.h_index}</p>
                                <p className="text-xs text-neutral-500">h-index</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{scholar.i10_index}</p>
                                <p className="text-xs text-neutral-500">i10-index</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-4 items-center">
                {/* Year Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm"
                >
                    <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
                        <SparklesIcon className="w-4 h-4 mr-2 text-accent" />
                        Publications by Year
                    </h3>
                    <div className="flex items-end justify-center h-36 gap-6">
                        {years.map((year, idx) => {
                            const count = stats.byYear[year];
                            const height = Math.max((count / maxYearCount) * 100, 10);
                            const isSelected = selectedYear === year;
                            return (
                                <div
                                    key={year}
                                    className="w-12 flex flex-col items-center h-full cursor-pointer group"
                                    onClick={() => onYearFilter?.(isSelected ? null : year)}
                                >
                                    <div className="flex-1 w-full flex items-end justify-center">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${height}%` }}
                                            transition={{ delay: 0.4 + idx * 0.1, duration: 0.5 }}
                                            className={`w-full rounded-t-lg relative transition-all ${
                                                isSelected
                                                    ? 'bg-gradient-to-t from-accent to-accent ring-2 ring-accent ring-offset-2'
                                                    : 'bg-gradient-to-t from-accent to-accent/70 group-hover:from-accent/90 group-hover:to-accent/60'
                                            }`}
                                        >
                                            <span className={`absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold ${isSelected ? 'text-accent' : 'text-accent'}`}>
                                                {count}
                                            </span>
                                        </motion.div>
                                    </div>
                                    <span className={`text-xs mt-1 font-medium transition-colors ${isSelected ? 'text-accent font-bold' : 'text-neutral-500 group-hover:text-accent'}`}>{year}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Topic Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm"
                >
                    <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
                        <GlobeAltIcon className="w-4 h-4 mr-2 text-accent" />
                        Research Topics
                    </h3>
                    <div className="space-y-2">
                        {sortedTopics.map(([topic, count], idx) => {
                            const config = topicConfig[topic];
                            const width = (count / maxTopicCount) * 100;
                            const isSelected = selectedTopic === topic;
                            return (
                                <motion.div
                                    key={topic}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.05 }}
                                    className="flex items-center gap-3 cursor-pointer group"
                                    onClick={() => onTopicFilter?.(isSelected ? null : topic)}
                                >
                                    <span className={`text-sm w-32 truncate transition-colors ${isSelected ? 'text-accent font-bold' : 'text-neutral-600 dark:text-neutral-400 group-hover:text-accent'}`}>
                                        {config?.label || topic}
                                    </span>
                                    <div className={`flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden transition-all ${isSelected ? 'ring-2 ring-accent' : 'group-hover:ring-2 ring-accent/30'}`}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${width}%` }}
                                            transition={{ delay: 0.6 + idx * 0.05, duration: 0.5 }}
                                            className={`h-full rounded-full ${config?.bgColor || 'bg-gray-500'}`}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 w-6 text-right">
                                        {count}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Venue Distribution */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm"
            >
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
                    <AcademicCapIcon className="w-4 h-4 mr-2 text-accent" />
                    Top Venues
                    {onVenueFilter && (
                        <span className="ml-2 text-xs text-neutral-500 font-normal">(click to filter)</span>
                    )}
                </h3>
                <div className="flex flex-wrap gap-2">
                    {sortedVenues.map(([venue, count], idx) => {
                        const isSelected = selectedVenue === venue;
                        return (
                            <motion.button
                                key={venue}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + idx * 0.05 }}
                                onClick={() => onVenueFilter?.(isSelected ? null : venue)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer text-sm ${
                                    isSelected
                                        ? 'bg-accent text-white ring-2 ring-accent ring-offset-2'
                                        : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-accent hover:text-white group'
                                }`}
                            >
                                <span className={`font-semibold ${isSelected ? 'text-white' : 'text-primary group-hover:text-white'}`}>{venue}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white text-accent' : 'bg-accent text-white group-hover:bg-white group-hover:text-accent'}`}>{count}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

        </div>
    );
}
