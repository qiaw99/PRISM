'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export interface NewsItem {
    date: string;
    content: string;
}

interface NewsProps {
    items: NewsItem[];
    title?: string;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr: string) {
    const [, month, day] = dateStr.split('-');
    return { month: monthNames[parseInt(month) - 1], day: parseInt(day) };
}

export default function News({ items, title = 'News' }: NewsProps) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
        >
            <h2 className="text-2xl font-serif font-bold text-primary mb-6">{title}</h2>
            <div className="space-y-2.5">
                {items.map((item, index) => {
                    const date = formatDate(item.date);
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
                            className="group relative bg-gradient-to-r from-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-800/50 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 hover:border-accent/40 hover:shadow-md transition-all duration-300 overflow-hidden"
                        >
                            <div className="flex items-stretch">
                                {/* Date Column */}
                                <div className="flex-shrink-0 w-14 flex flex-col items-center justify-center py-2.5 bg-gradient-to-b from-accent/5 to-accent/10 dark:from-accent/10 dark:to-accent/20 border-r border-neutral-200/60 dark:border-neutral-700/60">
                                    <span className="text-lg font-bold text-accent leading-none">{date.day}</span>
                                    <span className="text-[9px] font-semibold text-accent/70 uppercase tracking-widest mt-0.5">{date.month}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 px-3.5 py-2.5 min-w-0 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed flex items-center">
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

                            {/* Hover accent line */}
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                        </motion.div>
                    );
                })}
            </div>

            {/* News Archive Link */}
            <div className="mt-4 text-right">
                <a
                    href="/old_news"
                    className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 font-medium transition-colors"
                >
                    News Archive
                    <span className="text-xs">→</span>
                </a>
            </div>
        </motion.section>
    );
}
