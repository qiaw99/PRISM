'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { CalendarIcon, NewspaperIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { NewsPageConfig, NewsItem } from '@/types/page';

interface NewsPageProps {
    config: NewsPageConfig;
    content: string;
}

function parseNewsItems(content: string): NewsItem[] {
    const items: NewsItem[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
        const dateMatch = line.match(/^\*\*(\d{4})-(\d{2})-(\d{2})[:：]?\*\*/);
        if (dateMatch) {
            const year = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]);
            const date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
            const contentStart = line.indexOf('**', line.indexOf('**') + 2) + 2;
            const newsContent = line.slice(contentStart).replace(/^[:：]?\s*/, '').trim();

            items.push({ date, year, month, content: newsContent });
        }
    }

    return items.sort((a, b) => b.date.localeCompare(a.date));
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function NewsPage({ config, content }: NewsPageProps) {
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [rangeStart, setRangeStart] = useState<{ year: number; month: number } | null>(null);
    const [rangeEnd, setRangeEnd] = useState<{ year: number; month: number } | null>(null);
    const [showRangePicker, setShowRangePicker] = useState(false);

    const newsItems = useMemo(() => parseNewsItems(content), [content]);

    const stats = useMemo(() => {
        const yearCounts: Record<number, number> = {};
        const allYears = new Set<number>();

        newsItems.forEach(item => {
            allYears.add(item.year);
            yearCounts[item.year] = (yearCounts[item.year] || 0) + 1;
        });

        return {
            years: Array.from(allYears).sort(),
            byYear: yearCounts,
            total: newsItems.length,
        };
    }, [newsItems]);

    const maxYearCount = Math.max(...Object.values(stats.byYear));

    const filteredItems = useMemo(() => {
        return newsItems.filter(item => {
            if (rangeStart && rangeEnd) {
                const itemYM = item.year * 100 + item.month;
                const startYM = rangeStart.year * 100 + rangeStart.month;
                const endYM = rangeEnd.year * 100 + rangeEnd.month;
                return itemYM >= startYM && itemYM <= endYM;
            }
            if (selectedYear && item.year !== selectedYear) return false;
            return true;
        });
    }, [newsItems, selectedYear, rangeStart, rangeEnd]);

    const groupedItems = useMemo(() => {
        const groups: Record<number, NewsItem[]> = {};
        for (const item of filteredItems) {
            if (!groups[item.year]) groups[item.year] = [];
            groups[item.year].push(item);
        }
        return groups;
    }, [filteredItems]);

    const sortedYears = Object.keys(groupedItems).map(Number).sort((a, b) => b - a);

    const handleYearClick = (year: number) => {
        if (selectedYear === year) {
            setSelectedYear(null);
        } else {
            setSelectedYear(year);
            setRangeStart(null);
            setRangeEnd(null);
        }
    };

    const clearFilters = () => {
        setSelectedYear(null);
        setRangeStart(null);
        setRangeEnd(null);
    };

    const handleMonthClick = (year: number, month: number) => {
        if (!rangeStart || (rangeStart && rangeEnd)) {
            setRangeStart({ year, month });
            setRangeEnd(null);
            setSelectedYear(null);
        } else {
            const startYM = rangeStart.year * 100 + rangeStart.month;
            const clickedYM = year * 100 + month;
            if (clickedYM >= startYM) {
                setRangeEnd({ year, month });
            } else {
                setRangeEnd(rangeStart);
                setRangeStart({ year, month });
            }
        }
    };

    const isMonthInRange = (year: number, month: number) => {
        if (!rangeStart) return false;
        const ym = year * 100 + month;
        const startYM = rangeStart.year * 100 + rangeStart.month;
        if (!rangeEnd) return ym === startYM;
        const endYM = rangeEnd.year * 100 + rangeEnd.month;
        return ym >= startYM && ym <= endYM;
    };

    const isMonthStart = (year: number, month: number) => rangeStart?.year === year && rangeStart?.month === month;
    const isMonthEnd = (year: number, month: number) => rangeEnd?.year === year && rangeEnd?.month === month;
    const hasNewsInMonth = (year: number, month: number) => newsItems.some(item => item.year === year && item.month === month);

    const formatRangeLabel = () => {
        if (!rangeStart) return null;
        const start = `${monthNamesFull[rangeStart.month - 1]} ${rangeStart.year}`;
        if (!rangeEnd) return start;
        const end = `${monthNamesFull[rangeEnd.month - 1]} ${rangeEnd.year}`;
        return `${start} — ${end}`;
    };

    const hasActiveFilter = selectedYear || (rangeStart && rangeEnd);

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return {
            day: parseInt(day),
            month: monthNames[parseInt(month) - 1],
            year: parseInt(year)
        };
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        >
            <div className="mb-8">
                <h1 className="text-4xl font-serif font-bold text-primary mb-4">{config.title}</h1>
                {config.description && (
                    <p className="text-lg text-neutral-600 dark:text-neutral-500 max-w-2xl">
                        {config.description}
                    </p>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={clearFilters}
                    className="bg-gradient-to-br from-red-100 to-rose-200 rounded-xl p-4 text-red-600 shadow-lg cursor-pointer hover:scale-105 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-500 text-xs font-medium">Total News</p>
                            <p className="text-3xl font-bold mt-1">{stats.total}</p>
                        </div>
                        <NewspaperIcon className="w-10 h-10 text-red-300 opacity-80" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    onClick={() => setShowRangePicker(!showRangePicker)}
                    className={cn(
                        "rounded-xl p-4 shadow-lg cursor-pointer hover:scale-105 transition-all backdrop-blur-md border border-neutral-200/50",
                        showRangePicker
                            ? "bg-neutral-200/80 text-neutral-700 dark:bg-neutral-300/30 dark:text-white"
                            : "bg-neutral-100/70 text-neutral-600 dark:bg-neutral-200/20 dark:text-white"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-neutral-500 dark:text-neutral-300 text-xs font-medium">Date Range</p>
                            <p className="text-lg font-bold mt-1">
                                {showRangePicker ? 'Click to close' : 'Select period'}
                            </p>
                        </div>
                        <CalendarIcon className="w-10 h-10 text-neutral-400 dark:text-neutral-300 opacity-80" />
                    </div>
                </motion.div>
            </div>

            {/* Year Bar Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm mb-6"
            >
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2 text-accent" />
                    News by Year
                    <span className="ml-2 text-xs text-neutral-500 font-normal">(click to filter)</span>
                </h3>
                <div className="flex items-end justify-center h-32 gap-4">
                    {stats.years.map((year, idx) => {
                        const count = stats.byYear[year];
                        const height = Math.max((count / maxYearCount) * 100, 10);
                        const isSelected = selectedYear === year;

                        return (
                            <div
                                key={year}
                                className="flex flex-col items-center h-full cursor-pointer group"
                                style={{ width: `${100 / stats.years.length}%`, maxWidth: '80px' }}
                                onClick={() => handleYearClick(year)}
                            >
                                <div className="flex-1 w-full flex flex-col items-center justify-end">
                                    <div className="text-xs font-bold text-red-400 mb-1">{count}</div>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
                                        className={cn(
                                            "w-full rounded-t-lg bg-gradient-to-t from-red-200 to-red-100 transition-all",
                                            isSelected
                                                ? 'ring-2 ring-accent ring-offset-2'
                                                : 'group-hover:ring-2 group-hover:ring-accent/50'
                                        )}
                                        style={{ maxHeight: 'calc(100% - 20px)' }}
                                    />
                                </div>
                                <span className={cn(
                                    "text-xs mt-1 font-medium transition-colors",
                                    isSelected ? 'text-accent font-bold' : 'text-neutral-500 group-hover:text-accent'
                                )}>
                                    {year}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Date Range Picker */}
            {showRangePicker && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm mb-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-primary flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-2 text-violet-500" />
                            Select Date Range
                            <span className="ml-2 text-xs text-neutral-500 font-normal">
                                {rangeStart && !rangeEnd ? '(click end month)' : '(click start month)'}
                            </span>
                        </h3>
                        {(rangeStart || rangeEnd) && (
                            <button
                                onClick={() => { setRangeStart(null); setRangeEnd(null); }}
                                className="text-xs text-neutral-500 hover:text-accent flex items-center gap-1"
                            >
                                <XMarkIcon className="w-3 h-3" /> Clear
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {stats.years.map(year => (
                            <div key={year} className="flex items-center gap-2">
                                <span className="text-sm font-bold text-primary w-12">{year}</span>
                                <div className="flex flex-wrap gap-1 flex-1">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                                        const hasNews = hasNewsInMonth(year, month);
                                        const inRange = isMonthInRange(year, month);
                                        const isStart = isMonthStart(year, month);
                                        const isEnd = isMonthEnd(year, month);

                                        return (
                                            <button
                                                key={month}
                                                onClick={() => hasNews && handleMonthClick(year, month)}
                                                disabled={!hasNews}
                                                className={cn(
                                                    "w-10 h-8 text-xs rounded transition-all",
                                                    hasNews
                                                        ? inRange
                                                            ? isStart || isEnd
                                                                ? 'bg-violet-500 text-white font-bold'
                                                                : 'bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-200'
                                                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-violet-100 dark:hover:bg-violet-900/50'
                                                        : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
                                                )}
                                            >
                                                {monthNames[month - 1]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Filter Indicator */}
            {hasActiveFilter && (
                <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Showing news for</span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                        {selectedYear || formatRangeLabel()}
                        <button onClick={clearFilters} className="ml-1 hover:opacity-70">×</button>
                    </span>
                    <span className="text-sm text-neutral-500">({filteredItems.length} items)</span>
                </div>
            )}

            {/* News Cards */}
            <div className="space-y-8">
                {sortedYears.map((year, yearIdx) => (
                    <motion.div
                        key={year}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: yearIdx * 0.1 }}
                        className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden"
                    >
                        {/* Year Header */}
                        <div className="bg-gradient-to-r from-accent/10 to-accent/5 dark:from-accent/20 dark:to-accent/10 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                            <h2 className="text-2xl font-serif font-bold text-primary flex items-center gap-3">
                                <span className="bg-gradient-to-r from-accent to-accent/70 text-white px-4 py-1 rounded-full text-lg">
                                    {year}
                                </span>
                                <span className="text-sm font-normal text-neutral-500">
                                    {groupedItems[year].length} updates
                                </span>
                            </h2>
                        </div>
                        {/* Year Content */}
                        <div className="p-4 space-y-3">
                            {groupedItems[year].map((item, idx) => {
                                const date = formatDate(item.date);
                                return (
                                    <motion.div
                                        key={`${item.date}-${idx}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: idx * 0.05 }}
                                        className="group relative bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:shadow-md hover:border-accent/30 transition-all duration-300 overflow-hidden"
                                    >
                                        <div className="flex">
                                            {/* Date Badge */}
                                            <div className="flex-shrink-0 w-16 bg-white dark:bg-neutral-800 flex flex-col items-center justify-center py-3 border-r border-neutral-200 dark:border-neutral-700 group-hover:bg-accent/5 transition-colors">
                                                <span className="text-xl font-bold text-primary">{date.day}</span>
                                                <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">{date.month}</span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 p-4 min-w-0">
                                                <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                                    <ReactMarkdown
                                                        rehypePlugins={[rehypeRaw]}
                                                        components={{
                                                            p: ({ children }) => <p className="mb-0">{children}</p>,
                                                            a: ({ ...props }) => (
                                                                <a
                                                                    {...props}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-accent font-medium hover:underline transition-colors"
                                                                />
                                                            ),
                                                            strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                                                            em: ({ children }) => <em className="italic text-neutral-600 dark:text-neutral-400">{children}</em>,
                                                        }}
                                                    >
                                                        {item.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover accent line */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}

                {filteredItems.length === 0 && (
                    <div className="text-center py-16">
                        <NewspaperIcon className="w-16 h-16 mx-auto text-neutral-300 dark:text-neutral-700 mb-4" />
                        <p className="text-neutral-500 dark:text-neutral-500">
                            No news items found for the selected period.
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
