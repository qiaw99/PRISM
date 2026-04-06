'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { CardPageConfig, CardItem } from '@/types/page';
import { useMemo, useState } from 'react';
import { FunnelIcon, AcademicCapIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Extended card item type that includes optional image and category
interface ExtendedCardItem extends CardItem {
    image?: string;
    category?: string;
}

export default function CardPage({ config, embedded = false }: { config: CardPageConfig; embedded?: boolean }) {
    const [selectedDegree, setSelectedDegree] = useState<'all' | 'B.Sc.' | 'M.Sc.'>('all');
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'ongoing' | 'completed'>('all');
    const [showFilters, setShowFilters] = useState(false);

    // 判断item是否为ongoing状态
    const isOngoing = (item: ExtendedCardItem): boolean => {
        const date = item.date?.toLowerCase() || '';
        return date === 'ongoing' || date.includes('ongoing');
    };

    // 过滤thesis items
    const filteredThesisItems = useMemo(() => {
        return (config.items as ExtendedCardItem[]).filter(item => {
            // 只过滤thesis category
            if (item.category !== 'thesis') return false;

            // 学位过滤
            const matchesDegree = selectedDegree === 'all' || item.tags?.includes(selectedDegree);

            // 状态过滤
            let matchesStatus = true;
            if (selectedStatus === 'ongoing') {
                matchesStatus = isOngoing(item);
            } else if (selectedStatus === 'completed') {
                matchesStatus = !isOngoing(item);
            }

            return matchesDegree && matchesStatus;
        });
    }, [config.items, selectedDegree, selectedStatus]);

    // 获取所有thesis items（用于显示总数）
    const allThesisItems = useMemo(() => {
        return (config.items as ExtendedCardItem[]).filter(item => item.category === 'thesis');
    }, [config.items]);

    // 按 category 分组（thesis使用过滤后的items，其他保持原样）
    const groupedItems = useMemo(() => {
        const groups: Record<string, ExtendedCardItem[]> = {};

        (config.items as ExtendedCardItem[]).forEach(item => {
            const category = item.category || 'default';

            // thesis category 使用过滤后的结果
            if (category === 'thesis') {
                if (!groups[category]) {
                    groups[category] = filteredThesisItems;
                }
            } else {
                // 其他 category 保持原样
                if (!groups[category]) {
                    groups[category] = [];
                }
                groups[category].push(item);
            }
        });

        return groups;
    }, [config.items, filteredThesisItems]);

    // 获取分组标题
    const getCategoryTitle = (category: string) => {
        const titles: Record<string, string> = {
            'thesis': '🎓 Thesis Supervision',
            'research-assistant': '🔬 Research Assistant Supervision',
            'default': ''
        };
        return titles[category] || category;
    };

    // 获取分组描述
    const getCategoryDescription = (category: string) => {
        const descriptions: Record<string, string> = {
            'thesis': "",
            'research-assistant': '',
            'default': ''
        };
        return descriptions[category] || '';
    };

    // 如果只有一个分组(default),则不显示分组标题
    const hasMultipleCategories = Object.keys(groupedItems).length > 1 || !groupedItems['default'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        >
            <div className={embedded ? "mb-4" : "mb-8"}>
                <h1 className={`${embedded ? "text-2xl" : "text-4xl"} font-serif font-bold text-primary mb-4`}>{config.title}</h1>
                {config.description && (
                    <p className={`${embedded ? "text-base" : "text-lg"} text-neutral-600 dark:text-neutral-500 max-w-2xl`}>
                        {config.description}
                    </p>
                )}
            </div>

            {/* 渲染分组 */}
            {Object.entries(groupedItems).filter(([category, items]) => items.length > 0 || category === 'thesis').map(([category, items], groupIndex) => (
                <div key={category} className={groupIndex > 0 ? 'mt-12' : ''}>
                    {/* 分组标题 */}
                    {hasMultipleCategories && category !== 'default' && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-serif font-bold text-primary">
                                    {getCategoryTitle(category)}
                                </h2>
                                {/* Filter 按钮 - 只在 thesis 分组显示 */}
                                {category === 'thesis' && (
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={cn(
                                            "flex items-center justify-center px-3 py-1.5 rounded-lg border transition-all duration-200 text-sm",
                                            showFilters
                                                ? "bg-accent text-white border-accent"
                                                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 hover:border-accent hover:text-accent"
                                        )}
                                    >
                                        <FunnelIcon className="h-4 w-4 mr-1.5" />
                                        Filters
                                    </button>
                                )}
                            </div>
                            {getCategoryDescription(category) && (
                                <p className="text-base text-neutral-600 dark:text-neutral-500">
                                    {getCategoryDescription(category)}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Thesis 过滤器面板 */}
                    {category === 'thesis' && (
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden mb-6"
                                >
                                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-6">
                                        {/* Degree Filter */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                                                <AcademicCapIcon className="h-4 w-4 mr-1" /> Degree
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {(['all', 'B.Sc.', 'M.Sc.'] as const).map(degree => (
                                                    <button
                                                        key={degree}
                                                        onClick={() => setSelectedDegree(degree)}
                                                        className={cn(
                                                            "px-3 py-1 text-xs rounded-full transition-colors",
                                                            selectedDegree === degree
                                                                ? "bg-accent text-white"
                                                                : "bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                                        )}
                                                    >
                                                        {degree === 'all' ? 'All' : degree}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Status Filter */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                                                <CalendarIcon className="h-4 w-4 mr-1" /> Status
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {(['all', 'ongoing', 'completed'] as const).map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => setSelectedStatus(status)}
                                                        className={cn(
                                                            "px-3 py-1 text-xs rounded-full transition-colors capitalize",
                                                            selectedStatus === status
                                                                ? "bg-accent text-white"
                                                                : "bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                                        )}
                                                    >
                                                        {status === 'all' ? 'All' : status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Results Count */}
                                    {(selectedDegree !== 'all' || selectedStatus !== 'all') && (
                                        <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                                            Showing <span className="font-semibold text-accent">{filteredThesisItems.length}</span> of{' '}
                                            <span className="font-semibold">{allThesisItems.length}</span> theses
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* 空结果提示 - 只在thesis过滤无结果时显示 */}
                    {category === 'thesis' && items.length === 0 && (selectedDegree !== 'all' || selectedStatus !== 'all') && (
                        <div className="text-center py-8 text-neutral-500">
                            No theses found matching your criteria.
                        </div>
                    )}

                    {/* 卡片列表 */}
                    <div className={`grid ${embedded ? "gap-4" : "gap-6"}`}>
                        {items.map((item, index) => {
                            const hasImage = !!item.image;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.1 * index }}
                                    className={`bg-white dark:bg-neutral-900 ${embedded ? "p-4" : "p-6"} rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]`}
                                >
                                    <div className={hasImage ? "flex flex-col md:flex-row gap-6" : ""}>
                                        {/* 图片部分 */}
                                        {hasImage && item.image && (
                                            <div className="w-full md:w-48 flex-shrink-0">
                                                <div className="aspect-video md:aspect-[4/3] relative rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                                                    <Image
                                                        src={item.image.startsWith('http') ? item.image : `/talks/${item.image}`}
                                                        alt={item.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 768px) 100vw, 200px"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* 内容部分 */}
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className={`${embedded ? "text-lg" : "text-xl"} font-semibold text-primary`}>{item.title}</h3>
                                                {item.date && (
                                                    <span className="text-sm text-neutral-500 font-medium bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded whitespace-nowrap ml-4">
                                                        {item.date}
                                                    </span>
                                                )}
                                            </div>
                                            {item.subtitle && (
                                                <p className={`${embedded ? "text-sm" : "text-base"} text-accent font-medium mb-3`}>{item.subtitle}</p>
                                            )}
                                            {item.content && (
                                                <p className={`${embedded ? "text-sm" : "text-base"} text-neutral-600 dark:text-neutral-500 leading-relaxed`}>
                                                    {item.content}
                                                </p>
                                            )}
                                            {item.tags && (
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {item.tags.map(tag => (
                                                        <span key={tag} className="text-xs text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 px-2 py-1 rounded border border-neutral-100 dark:border-neutral-800">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </motion.div>
    );
}