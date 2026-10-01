'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    MagnifyingGlassIcon,
    BookOpenIcon,
    ClipboardDocumentIcon,
    CheckIcon,
    DocumentTextIcon,
    ArrowTopRightOnSquareIcon,
    NewspaperIcon,
    AcademicCapIcon,
    BookOpenIcon as BookIcon,
    CpuChipIcon,
    CodeBracketIcon,
    UserIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { Publication } from '@/types/publication';
import { PublicationPageConfig } from '@/types/page';
import { cn } from '@/lib/utils';
import PublicationsOverview from './PublicationsOverview';

interface ScholarStats {
    citations: number;
    h_index: number;
    i10_index: number;
    profile_url?: string;
}

interface PublicationsListProps {
    config: PublicationPageConfig;
    publications: Publication[];
    embedded?: boolean;
    scholar?: ScholarStats;
}

// --- NEW COMPONENT: PublicationIcon ---
const PublicationIcon = ({ type, className }: { type: Publication['type']; className?: string }) => {
    let IconComponent;
    let title;

    switch (type) {
        case 'journal':
            IconComponent = NewspaperIcon;
            title = 'Journal Article';
            break;
        case 'conference':
            IconComponent = ClipboardDocumentIcon;
            title = 'Conference Paper / Proceeding';
            break;
        case 'book-chapter':
            IconComponent = BookIcon;
            title = 'Book Chapter';
            break;
        case 'book':
            IconComponent = BookIcon;
            title = 'Book';
            break;
        case 'thesis':
            IconComponent = AcademicCapIcon;
            title = 'Thesis';
            break;
        case 'technical-report':
        case 'preprint':
        default:
            IconComponent = CpuChipIcon;
            title = 'Preprint / Technical Report / Misc';
            break;
    }

    return (
        <div className={cn("flex-shrink-0 flex items-center justify-center p-2 rounded-full bg-accent text-white h-8 w-8", className)} title={title}>
            <IconComponent className="h-5 w-5" />
        </div>
    );
};

// ------------------------------------

// Topic display names and colors
const topicConfig: Record<string, { label: string; color: string }> = {
    'counterfactual': { label: 'Counterfactual', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    'conversational-xai': { label: 'Conversational XAI', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    'faithfulness': { label: 'Faithfulness', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    'interpretability': { label: 'Interpretability', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    'multilingual': { label: 'Multilingual', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
    'rag': { label: 'RAG', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
    'rationale': { label: 'Rationale', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
    'misc': { label: 'Misc', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
};

const TopicBadges = ({ topics, className }: { topics?: string[]; className?: string }) => {
    if (!topics || topics.length === 0) return null;

    return (
        <div className={cn("flex flex-wrap gap-1", className)}>
            {topics.map((topic) => {
                const config = topicConfig[topic];
                if (!config) return null;
                return (
                    <button
                        key={topic}
                        type="button"
                        onClick={() => {}}
                        className={cn(
                            "inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer",
                            "hover:scale-105 hover:shadow-sm active:scale-95",
                            config.color
                        )}
                    >
                        {config.label}
                    </button>
                );
            })}
        </div>
    );
};

export default function PublicationsList({ config, publications, embedded = false, scholar }: PublicationsListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [selectedType] = useState<string | 'all'>('all');
    const [selectedTopic, setSelectedTopic] = useState<string | 'all'>('all');
    const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
    const [selectedCard, setSelectedCard] = useState<'firstAuthor' | 'conference' | 'workshop' | 'inSubmission' | null>(null);
    const [expandedBibtexId, setExpandedBibtexId] = useState<string | null>(null);
    const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);
    const [expandedAuthorsId, setExpandedAuthorsId] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleVenueFilter = (venue: string | null) => {
        setSelectedVenue(venue);
    };

    const handleYearFilter = (year: number | null) => {
        setSelectedYear(year ?? 'all');
    };

    const handleTopicFilter = (topic: string | null) => {
        setSelectedTopic(topic ?? 'all');
    };

    const handleCardFilter = (card: 'firstAuthor' | 'conference' | 'workshop' | 'inSubmission' | null) => {
        setSelectedCard(card);
    };

    const handleResetAll = () => {
        setSearchQuery('');
        setSelectedYear('all');
        setSelectedTopic('all');
        setSelectedVenue(null);
        setSelectedCard(null);
    };

    const copyBibtex = (id: string, bibtex: string) => {
        navigator.clipboard.writeText(bibtex);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // 获取作者位置优先级: 0=纯一作, 1=共一, 2=非一作
    const getAuthorPriority = (pub: Publication): number => {
        if (!pub.authors || pub.authors.length === 0) return 2;

        // 纯一作：排在第一位
        if (pub.authors[0].isHighlighted === true) {
            return 0;
        }

        // 共一：排在第二位但有 equal contribution
        if (pub.authors.length >= 2 && pub.authors[1].isHighlighted === true) {
            const description = pub.description?.toLowerCase() || '';
            const hasEqualContribution =
                description.includes('equal contribution') ||
                description.includes('share the first authorship') ||
                description.includes('co-first author') ||
                description.includes('contributed equally');

            if (hasEqualContribution) {
                return 1;
            }
        }

        return 2;
    };

    // 判断是否为第一作者(包括共同第一作者)
    const isFirstAuthor = useCallback((pub: Publication): boolean => {
        return getAuthorPriority(pub) < 2;
    }, []);

    // Extract main venue from workshop format (e.g., "TrustNLP @ ACL 2026" -> "acl")
    const getMainVenue = (venue: string): string => {
        const lower = venue.toLowerCase();
        // Check for workshop format: "XXX @ YYY" or "XXX @YYY"
        const atMatch = lower.match(/@\s*(\w+)/);
        if (atMatch) {
            return atMatch[1]; // Return the main conference name
        }
        // Otherwise extract first word/acronym (e.g., "EMNLP 2024" -> "emnlp")
        const firstWord = lower.match(/^[\w-]+/);
        return firstWord ? firstWord[0] : lower;
    };

    // Build venue order map based on first appearance in bib file (using bibIndex)
    const venueOrderMap = useMemo(() => {
        const orderMap = new Map<string, number>();
        // Sort by bibIndex to get original bib file order
        const sortedByBibIndex = [...publications].sort((a, b) => (a.bibIndex ?? Infinity) - (b.bibIndex ?? Infinity));
        sortedByBibIndex.forEach((pub) => {
            const venue = pub.conference || pub.journal || '';
            const mainVenue = getMainVenue(venue);
            if (mainVenue && !orderMap.has(mainVenue)) {
                orderMap.set(mainVenue, orderMap.size);
            }
        });
        return orderMap;
    }, [publications]);

    // Filter publications
    const filteredPublications = useMemo(() => {
        const filtered = publications.filter(pub => {
            const matchesSearch =
                pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pub.authors.some(author => author.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                pub.journal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pub.conference?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesYear = selectedYear === 'all' || pub.year === selectedYear;
            const matchesType = selectedType === 'all' || pub.type === selectedType;
            const matchesTopic = selectedTopic === 'all' || pub.topics?.includes(selectedTopic as never);

            const isWorkshopPaper = (p: Publication): boolean => {
                const venue = (p.conference || p.journal || '').toUpperCase();
                return venue.includes('@') || venue.includes('WORKSHOP');
            };

            const isInSubmission = (p: Publication): boolean => {
                const desc = p.description?.toLowerCase() || '';
                return desc.includes('in submission') || desc.includes('under review');
            };

            const matchesCard = !selectedCard || (() => {
                switch (selectedCard) {
                    case 'firstAuthor': return isFirstAuthor(pub);
                    case 'conference': return pub.type === 'conference' && !isWorkshopPaper(pub);
                    case 'workshop': return isWorkshopPaper(pub);
                    case 'inSubmission': return isInSubmission(pub);
                    default: return true;
                }
            })();

            const matchesVenue = !selectedVenue || (() => {
                const venue = (pub.conference || pub.journal || '').toUpperCase();
                const isWorkshop = venue.includes('@') || venue.includes('WORKSHOP');
                if (selectedVenue === 'Workshop') {
                    return isWorkshop;
                }
                // Workshop papers should not match main conference names
                if (isWorkshop) {
                    return false;
                }
                const regex = new RegExp(`\\b${selectedVenue.toUpperCase()}\\b`);
                return regex.test(venue);
            })();

            return matchesSearch && matchesYear && matchesType && matchesTopic && matchesCard && matchesVenue;
        });

        // Sort: by year descending, group by venue (bib file order), then first author priority
        return filtered.sort((a, b) => {
            // First sort by year descending
            if (b.year !== a.year) return b.year - a.year;

            // Then group by venue (conference or journal)
            const aVenue = a.conference || a.journal || '';
            const bVenue = b.conference || b.journal || '';
            const aMainVenue = getMainVenue(aVenue);
            const bMainVenue = getMainVenue(bVenue);

            // Publications with venue come before those without
            if (aMainVenue && !bMainVenue) return -1;
            if (!aMainVenue && bMainVenue) return 1;

            // Sort by venue order from bib file (first appearance order)
            const aOrder = venueOrderMap.get(aMainVenue) ?? Infinity;
            const bOrder = venueOrderMap.get(bMainVenue) ?? Infinity;
            if (aOrder !== bOrder) return aOrder - bOrder;

            // Within the same main venue, main conference comes before workshop
            const aIsWorkshop = aVenue.includes('@');
            const bIsWorkshop = bVenue.includes('@');
            if (!aIsWorkshop && bIsWorkshop) return -1;
            if (aIsWorkshop && !bIsWorkshop) return 1;

            // Within the same venue, sort by author priority (0=纯一作 > 1=共一 > 2=非一作)
            const aPriority = getAuthorPriority(a);
            const bPriority = getAuthorPriority(b);
            if (aPriority !== bPriority) return aPriority - bPriority;

            return 0;
        });
    }, [publications, searchQuery, selectedYear, selectedType, selectedTopic, selectedCard, selectedVenue, venueOrderMap, isFirstAuthor]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        >
            <div className="mb-8">
                <h1 className={`${embedded ? "text-2xl" : "text-4xl"} font-serif font-bold text-primary mb-4`}>{config.title}</h1>
                {config.description && (
                    <div className="max-w-2xl">
                        <p className={`${embedded ? "text-base" : "text-lg"} text-neutral-600 dark:text-neutral-500 inline`}>
                            {config.description}
                        </p>
                    </div>
                )}
            </div>

            {/* Publications Overview */}
            {!embedded && (
                <PublicationsOverview
                    publications={publications}
                    scholar={scholar}
                    onVenueFilter={handleVenueFilter}
                    onYearFilter={handleYearFilter}
                    onTopicFilter={handleTopicFilter}
                    onCardFilter={handleCardFilter}
                    onResetAll={handleResetAll}
                    selectedYear={selectedYear}
                    selectedTopic={selectedTopic}
                    selectedVenue={selectedVenue}
                    selectedCard={selectedCard}
                />
            )}

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search publications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                    />
                </div>
            </div>

            {/* Results Count */}
            <div id="publications-list" className="mb-4 text-sm text-neutral-600 dark:text-neutral-400 flex items-center flex-wrap gap-2">
                <span>
                    Showing <span className="font-semibold text-accent">{filteredPublications.length}</span> of{' '}
                    <span className="font-semibold">{publications.length}</span> publications
                </span>
                {selectedCard && (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${
                        selectedCard === 'firstAuthor' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                        selectedCard === 'conference' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                        selectedCard === 'workshop' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                        'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                    }`}>
                        {selectedCard === 'firstAuthor' ? 'First Author' :
                         selectedCard === 'conference' ? 'Conferences' :
                         selectedCard === 'workshop' ? 'Workshops' : 'In Submission'}
                        <button onClick={() => setSelectedCard(null)} className="ml-1 hover:opacity-70">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </span>
                )}
                {selectedYear !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                        Year: {selectedYear}
                        <button onClick={() => setSelectedYear('all')} className="ml-1 hover:opacity-70">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </span>
                )}
                {selectedTopic !== 'all' && (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${topicConfig[selectedTopic]?.color || 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                        Topic: {topicConfig[selectedTopic]?.label || selectedTopic}
                        <button onClick={() => setSelectedTopic('all')} className="ml-1 hover:opacity-70">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </span>
                )}
                {selectedVenue && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full">
                        Venue: {selectedVenue}
                        <button onClick={() => setSelectedVenue(null)} className="ml-1 hover:opacity-70">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </span>
                )}
                {(selectedYear !== 'all' || selectedTopic !== 'all' || selectedVenue || selectedCard || searchQuery) && (
                    <button
                        onClick={() => {
                            setSelectedYear('all');
                            setSelectedTopic('all');
                            setSelectedVenue(null);
                            setSelectedCard(null);
                            setSearchQuery('');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                        Clear All
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Publications Grid */}
            <div className="space-y-6">
                {filteredPublications.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                        No publications found matching your criteria.
                    </div>
                ) : (
                    filteredPublications.map((pub, index) => {
                        const prevPub = index > 0 ? filteredPublications[index - 1] : null;
                        const showYearDivider = !prevPub || prevPub.year !== pub.year;

                        return (
                            <div key={pub.id}>
                                {/* Year Divider */}
                                {showYearDivider && (
                                    <div className={`flex items-center gap-4 ${index > 0 ? 'mt-8 mb-6' : 'mb-6'}`}>
                                        <div className="flex-shrink-0">
                                            <span className="text-2xl font-bold text-accent">{pub.year}</span>
                                        </div>
                                        <div className="flex-grow h-px bg-gradient-to-r from-accent/50 to-transparent"></div>
                                    </div>
                                )}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.05 * index }}
                                    className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex flex-col md:flex-row gap-6">
                                {pub.preview && (
                                    <div className="w-full md:w-48 flex-shrink-0">
                                        <div
                                            className="aspect-video md:aspect-[4/3] relative rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 cursor-pointer group"
                                            onClick={() => setPreviewImage(`/papers/${pub.preview}`)}
                                        >
                                            <Image
                                                src={`/papers/${pub.preview}`}
                                                alt={pub.title}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
                                                    Click to preview
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex-grow">
                                    {/* Primary Publication Info */}
                                    <div className='flex items-start mb-2'>
                                        {/* Publication Type Icon */}
                                        <PublicationIcon type={pub.type} className='mr-3 mt-1' />

                                        <div className="flex-grow">
                                            <div className="flex items-start gap-2">
                                                <h3 className={`${embedded ? "text-lg" : "text-xl"} font-semibold text-primary leading-tight flex-grow`}>
                                                    {pub.title}
                                                </h3>
                                                {/* First Author Badge */}
                                                {isFirstAuthor(pub) && (
                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full whitespace-nowrap">
                                                        <UserIcon className="h-3 w-3 mr-1" />
                                                        1st Author
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Authors with expand/collapse */}
                                    <div className={`${embedded ? "text-sm" : "text-base"} text-neutral-600 dark:text-neutral-400 mb-2 pl-11`}>
                                        {(() => {
                                            const maxAuthors = 7;
                                            const isExpanded = expandedAuthorsId === pub.id;

                                            const lastAuthor = pub.authors[pub.authors.length - 1];
                                            const lastIsVeraSchmitt = lastAuthor?.name?.toLowerCase().includes('vera schmitt');

                                            const shouldTruncate = (pub.authors.length > maxAuthors || lastIsVeraSchmitt) && !isExpanded;

                                            let displayedAuthors;
                                            let hiddenCount;

                                            if (shouldTruncate) {
                                                if (lastIsVeraSchmitt && pub.authors.length <= maxAuthors) {
                                                    displayedAuthors = pub.authors.slice(0, -1);
                                                    hiddenCount = 1;
                                                } else {
                                                    displayedAuthors = pub.authors.slice(0, maxAuthors);
                                                    hiddenCount = pub.authors.length - maxAuthors;
                                                }
                                            } else {
                                                displayedAuthors = pub.authors;
                                                hiddenCount = 0;
                                            }

                                            return (
                                                <>
                                                    {displayedAuthors.map((author, idx) => (
                                                        <span key={idx}>
                                                            <span className={author.isHighlighted ? 'font-semibold text-accent' : ''}>
                                                                {author.name}
                                                            </span>
                                                            {author.isCorresponding && (
                                                                <sup className={`ml-0 ${author.isHighlighted ? 'text-accent' : 'text-neutral-600 dark:text-neutral-400'}`}>†</sup>
                                                            )}
                                                            {idx < displayedAuthors.length - 1 && ', '}
                                                        </span>
                                                    ))}
                                                    {shouldTruncate && hiddenCount > 0 && (
                                                        <button
                                                            onClick={() => setExpandedAuthorsId(pub.id)}
                                                            className="ml-1 text-accent hover:underline cursor-pointer text-sm"
                                                        >
                                                            ... +{hiddenCount} more
                                                        </button>
                                                    )}
                                                    {isExpanded && (pub.authors.length > maxAuthors || lastIsVeraSchmitt) && (
                                                        <button
                                                            onClick={() => setExpandedAuthorsId(null)}
                                                            className="ml-1 text-accent hover:underline cursor-pointer text-sm"
                                                        >
                                                            (show less)
                                                        </button>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>

                                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-600 mb-3 pl-11">
                                        {pub.journal || pub.conference} {pub.year}
                                    </p>

                                    {pub.description && (
                                        <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-4 line-clamp-3">
                                            {pub.description}
                                        </p>
                                    )}

                                    {/* Link Buttons and Topic Badges */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 mt-auto">
                                        <div className="flex flex-wrap gap-2">
                                            {/* URL Link Button (for Paper/External Link) */}
                                            {pub.url && (
                                                <a
                                                    href={pub.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-accent hover:text-white transition-colors"
                                                >
                                                    <ArrowTopRightOnSquareIcon className="h-3 w-3 mr-1.5" />
                                                    Paper
                                                </a>
                                            )}

                                            {/* Code Link Button */}
                                            {pub.code && (
                                                <a
                                                    href={pub.code}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-accent hover:text-white transition-colors"
                                                >
                                                    <CodeBracketIcon className="h-3 w-3 mr-1.5" />
                                                    Code
                                                </a>
                                            )}

                                            {/* Abstract Button */}
                                            {pub.abstract && (
                                                <button
                                                    onClick={() => {
                                                        setExpandedBibtexId(null);
                                                        setExpandedAbstractId(expandedAbstractId === pub.id ? null : pub.id);
                                                    }}
                                                    className={cn(
                                                        "inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors",
                                                        expandedAbstractId === pub.id
                                                            ? "bg-accent text-white"
                                                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-accent hover:text-white"
                                                    )}
                                                >
                                                    <DocumentTextIcon className="h-3 w-3 mr-1.5" />
                                                    Abstract
                                                </button>
                                            )}

                                            {/* BibTeX Button */}
                                            {pub.bibtex && (
                                                <button
                                                    onClick={() => {
                                                        setExpandedAbstractId(null);
                                                        setExpandedBibtexId(expandedBibtexId === pub.id ? null : pub.id);
                                                    }}
                                                    className={cn(
                                                        "inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors",
                                                        expandedBibtexId === pub.id
                                                            ? "bg-accent text-white"
                                                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-accent hover:text-white"
                                                    )}
                                                >
                                                    <BookOpenIcon className="h-3 w-3 mr-1.5" />
                                                    BibTeX
                                                </button>
                                            )}
                                        </div>

                                        {/* Topic Badges */}
                                        <TopicBadges topics={pub.topics} />
                                    </div>

                                    {/* Abstract/BibTeX Expansion */}
                                    <AnimatePresence>
                                        {expandedAbstractId === pub.id && pub.abstract ? (
                                            <motion.div
                                                key="abstract"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden mt-4"
                                            >
                                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-500 leading-relaxed">
                                                        {pub.abstract}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ) : null}
                                        {expandedBibtexId === pub.id && pub.bibtex ? (
                                            <motion.div
                                                key="bibtex"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden mt-4"
                                            >
                                                <div className="relative bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                                                    <pre className="text-xs text-neutral-600 dark:text-neutral-500 overflow-x-auto whitespace-pre-wrap font-mono pr-16">
                                                        {pub.bibtex}
                                                    </pre>
                                                    <button
                                                        onClick={() => copyBibtex(pub.id, pub.bibtex || '')}
                                                        className={cn(
                                                            "absolute top-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium shadow-sm border transition-all duration-200",
                                                            copiedId === pub.id
                                                                ? "bg-green-500 text-white border-green-500"
                                                                : "bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-600 hover:bg-accent hover:text-white hover:border-accent"
                                                        )}
                                                    >
                                                        {copiedId === pub.id ? (
                                                            <>
                                                                <CheckIcon className="h-3.5 w-3.5" />
                                                                Copied
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                                                                Copy
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </div>
                            </div>
                                </motion.div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                        onClick={() => setPreviewImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative max-w-5xl max-h-[90vh] w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={previewImage}
                                alt="Preview"
                                width={1600}
                                height={1200}
                                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                            />
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                                title="Close preview"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}