'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    CalendarIcon,
    BookOpenIcon,
    ClipboardDocumentIcon,
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

interface PublicationsListProps {
    config: PublicationPageConfig;
    publications: Publication[];
    embedded?: boolean;
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

export default function PublicationsList({ config, publications, embedded = false }: PublicationsListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [selectedType, setSelectedType] = useState<string | 'all'>('all');
    const [selectedAuthorPosition, setSelectedAuthorPosition] = useState<'all' | 'first'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [expandedBibtexId, setExpandedBibtexId] = useState<string | null>(null);
    const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);
    const [expandedAuthorsId, setExpandedAuthorsId] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // 判断是否为第一作者(包括共同第一作者)
    const isFirstAuthor = (pub: Publication): boolean => {
        if (!pub.authors || pub.authors.length === 0) return false;

        if (pub.authors[0].isHighlighted === true) {
            return true;
        }

        if (pub.authors.length >= 2 && pub.authors[1].isHighlighted === true) {
            const description = pub.description?.toLowerCase() || '';
            const hasEqualContribution =
                description.includes('equal contribution') ||
                description.includes('share the first authorship') ||
                description.includes('co-first author') ||
                description.includes('contributed equally');

            if (hasEqualContribution) {
                return true;
            }

            if (pub.authors[0].isHighlighted) {
                return true;
            }
        }

        return false;
    };

    // Extract unique years and types for filters
    const years = useMemo(() => {
        const uniqueYears = Array.from(new Set(publications.map(p => p.year)));
        return uniqueYears.sort((a, b) => b - a);
    }, [publications]);

    const types = useMemo(() => {
        const uniqueTypes = Array.from(new Set(publications.map(p => p.type)));
        return uniqueTypes.sort();
    }, [publications]);

    // 统计第一作者论文数量
    const firstAuthorCount = useMemo(() => {
        return publications.filter(pub => {
            const yearMatch = selectedYear === 'all' || pub.year === selectedYear;
            const typeMatch = selectedType === 'all' || pub.type === selectedType;
            return yearMatch && typeMatch && isFirstAuthor(pub);
        }).length;
    }, [publications, selectedYear, selectedType]);

    // Filter publications
    const filteredPublications = useMemo(() => {
        return publications.filter(pub => {
            const matchesSearch =
                pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pub.authors.some(author => author.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                pub.journal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pub.conference?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesYear = selectedYear === 'all' || pub.year === selectedYear;
            const matchesType = selectedType === 'all' || pub.type === selectedType;
            const matchesAuthorPosition = selectedAuthorPosition === 'all' || isFirstAuthor(pub);

            return matchesSearch && matchesYear && matchesType && matchesAuthorPosition;
        });
    }, [publications, searchQuery, selectedYear, selectedType, selectedAuthorPosition]);

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

            {/* Search and Filter Controls */}
            <div className="mb-8 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search publications..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center justify-center px-4 py-2 rounded-lg border transition-all duration-200",
                            showFilters
                                ? "bg-accent text-white border-accent"
                                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 hover:border-accent hover:text-accent"
                        )}
                    >
                        <FunnelIcon className="h-5 w-5 mr-2" />
                        Filters
                    </button>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-6">
                                {/* Year Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                                        <CalendarIcon className="h-4 w-4 mr-1" /> Year
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setSelectedYear('all')}
                                            className={cn(
                                                "px-3 py-1 text-xs rounded-full transition-colors",
                                                selectedYear === 'all'
                                                    ? "bg-accent text-white"
                                                    : "bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                            )}
                                        >
                                            All
                                        </button>
                                        {years.map(year => (
                                            <button
                                                key={year}
                                                onClick={() => setSelectedYear(year)}
                                                className={cn(
                                                    "px-3 py-1 text-xs rounded-full transition-colors",
                                                    selectedYear === year
                                                        ? "bg-accent text-white"
                                                        : "bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                                )}
                                            >
                                                {year}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Type Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                                        <BookOpenIcon className="h-4 w-4 mr-1" /> Type
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setSelectedType('all')}
                                            className={cn(
                                                "px-3 py-1 text-xs rounded-full transition-colors",
                                                selectedType === 'all'
                                                    ? "bg-accent text-white"
                                                    : "bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                            )}
                                        >
                                            All
                                        </button>
                                        {types.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setSelectedType(type)}
                                                className={cn(
                                                    "px-3 py-1 text-xs rounded-full capitalize transition-colors",
                                                    selectedType === type
                                                        ? "bg-accent text-white"
                                                        : "bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                                )}
                                            >
                                                {type.replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Author Position Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                                        <UserIcon className="h-4 w-4 mr-1" /> Author Position
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setSelectedAuthorPosition('all')}
                                            className={cn(
                                                "px-3 py-1 text-xs rounded-full transition-colors",
                                                selectedAuthorPosition === 'all'
                                                    ? "bg-accent text-white"
                                                    : "bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                            )}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setSelectedAuthorPosition('first')}
                                            className={cn(
                                                "px-3 py-1 text-xs rounded-full transition-colors",
                                                selectedAuthorPosition === 'first'
                                                    ? "bg-accent text-white"
                                                    : "bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                            )}
                                        >
                                            First Author ({firstAuthorCount})
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                Showing <span className="font-semibold text-accent">{filteredPublications.length}</span> of{' '}
                <span className="font-semibold">{publications.length}</span> publications
                {selectedAuthorPosition === 'first' && ' (First author only)'}
            </div>

            {/* Publications Grid */}
            <div className="space-y-6">
                {filteredPublications.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                        No publications found matching your criteria.
                    </div>
                ) : (
                    filteredPublications.map((pub, index) => (
                        <motion.div
                            key={pub.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 * index }}
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

                                    {/* Link Buttons */}
                                    <div className="flex flex-wrap gap-2 mt-auto">

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
                                                onClick={() => setExpandedAbstractId(expandedAbstractId === pub.id ? null : pub.id)}
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
                                                onClick={() => setExpandedBibtexId(expandedBibtexId === pub.id ? null : pub.id)}
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
                                                    <pre className="text-xs text-neutral-600 dark:text-neutral-500 overflow-x-auto whitespace-pre-wrap font-mono">
                                                        {pub.bibtex}
                                                    </pre>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(pub.bibtex || '');
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 rounded-md bg-white dark:bg-neutral-700 text-neutral-500 hover:text-accent shadow-sm border border-neutral-200 dark:border-neutral-600 transition-colors"
                                                        title="Copy to clipboard"
                                                    >
                                                        <ClipboardDocumentIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    ))
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