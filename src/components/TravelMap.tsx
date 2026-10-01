'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface Destination {
    name: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
    year: string;
    conference?: string;
}

interface TravelMapProps {
    destinations: Destination[];
    homeCity?: { name: string; lat: number; lng: number };
}

const LeafletMap = dynamic(() => import('./LeafletMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[400px] bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center">
            <div className="text-neutral-500">Loading map...</div>
        </div>
    ),
});

export default function TravelMap({ destinations, homeCity }: TravelMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-full mb-12">
                <h2 className="text-2xl font-serif font-bold text-primary mb-4">Travel Map</h2>
                <div className="w-full h-[400px] bg-neutral-100 dark:bg-neutral-800 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="w-full mb-12">
            <h2 className="text-2xl font-serif font-bold text-primary mb-4">Travel Map</h2>
            <div className="rounded-2xl overflow-hidden shadow-xl">
                <LeafletMap destinations={destinations} homeCity={homeCity} />
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3">
                    <div className="text-2xl font-bold text-primary">{destinations.length}</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">Conferences</div>
                </div>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3">
                    <div className="text-2xl font-bold text-primary">
                        {new Set(destinations.map(d => d.country)).size}
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">Countries</div>
                </div>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3">
                    <div className="text-2xl font-bold text-primary">
                        {new Set(destinations.map(d => d.year)).size}
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">Years</div>
                </div>
            </div>
        </div>
    );
}
