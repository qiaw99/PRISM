'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
    StarIcon,
    PencilSquareIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ServiceItem {
    conference: string;
    year: number;
    note?: string;
    icon?: string;
}

interface ServiceRole {
    role: string;
    items: ServiceItem[];
}

interface ServicesPageConfig {
    type: 'services';
    title: string;
    description?: string;
    roles: ServiceRole[];
}

interface ServicesPageProps {
    config: ServicesPageConfig;
    embedded?: boolean;
}

const roleConfig: Record<string, { icon: typeof StarIcon; gradient: string; bgLight: string }> = {
    'Area Chair': {
        icon: StarIcon,
        gradient: 'from-amber-500 to-orange-500',
        bgLight: 'bg-amber-50 dark:bg-amber-900/20',
    },
    'Reviewer': {
        icon: PencilSquareIcon,
        gradient: 'from-blue-500 to-indigo-500',
        bgLight: 'bg-blue-50 dark:bg-blue-900/20',
    },
};

export default function ServicesPage({ config, embedded = false }: ServicesPageProps) {
    const [selectedYear, setSelectedYear] = useState<number | null>(null);

    const stats = useMemo(() => {
        const yearCounts: Record<number, { ac: number; reviewer: number }> = {};
        const allYears = new Set<number>();

        config.roles.forEach(role => {
            role.items.forEach(item => {
                allYears.add(item.year);
                if (!yearCounts[item.year]) {
                    yearCounts[item.year] = { ac: 0, reviewer: 0 };
                }
                if (role.role === 'Area Chair') {
                    yearCounts[item.year].ac++;
                } else {
                    yearCounts[item.year].reviewer++;
                }
            });
        });

        const totalAC = config.roles.find(r => r.role === 'Area Chair')?.items.length || 0;
        const totalReviewer = config.roles.find(r => r.role === 'Reviewer')?.items.length || 0;

        return {
            years: Array.from(allYears).sort(),
            byYear: yearCounts,
            totalAC,
            totalReviewer,
            total: totalAC + totalReviewer,
        };
    }, [config.roles]);

    const maxYearCount = Math.max(
        ...Object.values(stats.byYear).map(v => v.ac + v.reviewer)
    );

    const filteredRoles = useMemo(() => {
        if (!selectedYear) return config.roles;
        return config.roles.map(role => ({
            ...role,
            items: role.items.filter(item => item.year === selectedYear),
        })).filter(role => role.items.length > 0);
    }, [config.roles, selectedYear]);

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

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => setSelectedYear(null)}
                    className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl p-4 text-white shadow-lg cursor-pointer hover:scale-105 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-100 text-xs font-medium">Total Services</p>
                            <p className="text-3xl font-bold mt-1">{stats.total}</p>
                        </div>
                        <CalendarIcon className="w-10 h-10 text-slate-200 opacity-80" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-100 text-xs font-medium">Area Chair</p>
                            <p className="text-3xl font-bold mt-1">{stats.totalAC}</p>
                        </div>
                        <StarIcon className="w-10 h-10 text-amber-200 opacity-80" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl p-4 text-white shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-xs font-medium">Reviewer</p>
                            <p className="text-3xl font-bold mt-1">{stats.totalReviewer}</p>
                        </div>
                        <PencilSquareIcon className="w-10 h-10 text-blue-200 opacity-80" />
                    </div>
                </motion.div>
            </div>

            {/* Year Trend Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm mb-6"
            >
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2 text-accent" />
                    Services by Year
                    <span className="ml-2 text-xs text-neutral-500 font-normal">(click to filter)</span>
                </h3>
                <div className="flex items-end justify-center h-32 gap-4">
                    {stats.years.map((year, idx) => {
                        const counts = stats.byYear[year];
                        const total = counts.ac + counts.reviewer;
                        const height = Math.max((total / maxYearCount) * 100, 10);
                        const acHeight = total > 0 ? (counts.ac / total) * 100 : 0;
                        const isSelected = selectedYear === year;

                        return (
                            <div
                                key={year}
                                className="flex flex-col items-center h-full cursor-pointer group"
                                style={{ width: `${100 / stats.years.length}%`, maxWidth: '80px' }}
                                onClick={() => setSelectedYear(isSelected ? null : year)}
                            >
                                <div className="flex-1 w-full flex flex-col items-center justify-end">
                                    {/* Count labels above bar */}
                                    <div className="flex items-center gap-0.5 text-xs font-bold whitespace-nowrap mb-1">
                                        {counts.ac > 0 && (
                                            <span className="text-amber-500">{counts.ac}</span>
                                        )}
                                        {counts.ac > 0 && counts.reviewer > 0 && (
                                            <span className="text-neutral-400">+</span>
                                        )}
                                        <span className="text-blue-500">{counts.reviewer}</span>
                                    </div>
                                    {/* Bar */}
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
                                        className={cn(
                                            "w-full rounded-t-lg relative overflow-hidden transition-all",
                                            isSelected
                                                ? 'ring-2 ring-accent ring-offset-2'
                                                : 'group-hover:ring-2 group-hover:ring-accent/50'
                                        )}
                                        style={{ maxHeight: 'calc(100% - 20px)' }}
                                    >
                                        {/* Reviewer portion (bottom) */}
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400"
                                            style={{ height: `${100 - acHeight}%` }}
                                        />
                                        {/* AC portion (top) */}
                                        {counts.ac > 0 && (
                                            <div
                                                className="absolute top-0 left-0 right-0 bg-gradient-to-t from-amber-500 to-amber-400"
                                                style={{ height: `${acHeight}%` }}
                                            />
                                        )}
                                    </motion.div>
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
                {/* Legend */}
                <div className="flex justify-center gap-4 mt-3 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-amber-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">Area Chair</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-blue-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">Reviewer</span>
                    </div>
                </div>
            </motion.div>

            {/* Filter indicator */}
            {selectedYear && (
                <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        Showing services for
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                        {selectedYear}
                        <button
                            onClick={() => setSelectedYear(null)}
                            className="ml-1 hover:opacity-70"
                        >
                            ×
                        </button>
                    </span>
                </div>
            )}

            {/* Roles and Conferences */}
            <div className="space-y-6">
                {filteredRoles.map((roleData, idx) => {
                    const conf = roleConfig[roleData.role] || roleConfig['Reviewer'];
                    const Icon = conf.icon;

                    const groupedByYear = roleData.items.reduce((acc, item) => {
                        if (!acc[item.year]) acc[item.year] = [];
                        acc[item.year].push(item);
                        return acc;
                    }, {} as Record<number, ServiceItem[]>);

                    const sortedYears = Object.keys(groupedByYear).map(Number).sort((a, b) => b - a);

                    return (
                        <motion.div
                            key={roleData.role}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + idx * 0.1 }}
                            className={cn(
                                "rounded-xl p-5 border border-neutral-200 dark:border-neutral-800",
                                conf.bgLight
                            )}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={cn(
                                    "p-2 rounded-lg bg-gradient-to-br text-white",
                                    conf.gradient
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-serif font-bold text-primary">
                                    {roleData.role}
                                </h2>
                                <span className="text-sm text-neutral-500 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                                    {roleData.items.length} venue{roleData.items.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {sortedYears.map(year => (
                                    <div key={year} className="flex items-center gap-4">
                                        <span className="text-base font-bold text-accent bg-white dark:bg-neutral-800 px-3 py-2 rounded-lg min-w-[60px] text-center shadow-sm">
                                            {year}
                                        </span>
                                        <div className="flex flex-wrap gap-3 items-center">
                                            {groupedByYear[year].map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="relative group"
                                                >
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center bg-white dark:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shadow-sm cursor-default",
                                                            item.icon ? "p-1" : "px-4 py-2"
                                                        )}
                                                    >
                                                        {item.icon ? (
                                                            <Image
                                                                src={item.icon}
                                                                alt={item.conference}
                                                                width={36}
                                                                height={36}
                                                                className="w-9 h-9 object-contain"
                                                            />
                                                        ) : (
                                                            <>
                                                                <span className="font-medium text-base">{item.conference}</span>
                                                                {item.note && (
                                                                    <span className="ml-1 text-sm text-neutral-500">
                                                                        ({item.note})
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </span>
                                                    {item.icon && (
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 dark:bg-neutral-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                            {item.conference}{item.note && ` (${item.note})`}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
