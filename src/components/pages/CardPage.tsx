'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { CardPageConfig, CardItem } from '@/types/page';
import { useMemo } from 'react';

// Extended card item type that includes optional image and category
interface ExtendedCardItem extends CardItem {
    image?: string;
    category?: string;
}

export default function CardPage({ config, embedded = false }: { config: CardPageConfig; embedded?: boolean }) {
    // 按 category 分组
    const groupedItems = useMemo(() => {
        const groups: Record<string, ExtendedCardItem[]> = {};

        (config.items as ExtendedCardItem[]).forEach(item => {
            const category = item.category || 'default';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
        });

        return groups;
    }, [config.items]);

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
            {Object.entries(groupedItems).map(([category, items], groupIndex) => (
                <div key={category} className={groupIndex > 0 ? 'mt-12' : ''}>
                    {/* 分组标题 */}
                    {hasMultipleCategories && category !== 'default' && (
                        <div className="mb-6">
                            <h2 className="text-2xl font-serif font-bold text-primary mb-2">
                                {getCategoryTitle(category)}
                            </h2>
                            {getCategoryDescription(category) && (
                                <p className="text-base text-neutral-600 dark:text-neutral-500">
                                    {getCategoryDescription(category)}
                                </p>
                            )}
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