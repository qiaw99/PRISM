'use client';

import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Destination {
    name: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
    year: string;
    conference?: string;
}

interface LeafletMapProps {
    destinations: Destination[];
    homeCity?: { name: string; lat: number; lng: number };
}

const createCurvedPath = (
    start: [number, number],
    end: [number, number],
    numPoints: number = 50
): [number, number][] => {
    const points: [number, number][] = [];
    const [lat1, lng1] = start;
    const [lat2, lng2] = end;

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const lat = lat1 + (lat2 - lat1) * t;
        const lng = lng1 + (lng2 - lng1) * t;
        const arc = Math.sin(Math.PI * t) * 0.15 * Math.abs(lng2 - lng1);
        points.push([lat + arc, lng]);
    }

    return points;
};

const yearColors: Record<string, string> = {
    '2024': '#3b82f6',
    '2025': '#f59e0b',
    '2026': '#8b5cf6',
};

const getYearColor = (year: string): string => {
    return yearColors[year] || '#6b7280';
};

export default function LeafletMap({ destinations, homeCity }: LeafletMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const home = useMemo(() => homeCity || { name: 'Berlin', lat: 52.5200, lng: 13.4050 }, [homeCity]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [30, 20],
            zoom: 2,
            minZoom: 2,
            maxZoom: 6,
            scrollWheelZoom: true,
            zoomControl: true,
        });

        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);

        const homeIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    width: 20px;
                    height: 20px;
                    background: #10b981;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
        });

        const createDestIcon = (year: string) => L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    width: 16px;
                    height: 16px;
                    background: ${getYearColor(year)};
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
        });

        const getLabelDirection = (dest: Destination, allDests: Destination[]): { direction: L.Direction; offset: [number, number] } => {
            const nearby = allDests.filter(d =>
                d.name !== dest.name &&
                Math.abs(d.lat - dest.lat) < 8 &&
                Math.abs(d.lng - dest.lng) < 15
            );

            if (nearby.length === 0) {
                return { direction: 'top', offset: [0, -10] };
            }

            const avgLat = nearby.reduce((sum, d) => sum + d.lat, 0) / nearby.length;
            const avgLng = nearby.reduce((sum, d) => sum + d.lng, 0) / nearby.length;

            if (dest.lat > avgLat + 2) {
                return { direction: 'top', offset: [0, -10] };
            } else if (dest.lat < avgLat - 2) {
                return { direction: 'bottom', offset: [0, 10] };
            } else if (dest.lng > avgLng) {
                return { direction: 'right', offset: [10, 0] };
            } else {
                return { direction: 'left', offset: [-10, 0] };
            }
        };

        const allLocations: Destination[] = [
            { name: home.name, city: home.name, country: '', lat: home.lat, lng: home.lng, year: '' },
            ...destinations
        ];

        L.marker([home.lat, home.lng], { icon: homeIcon })
            .addTo(map)
            .bindPopup(`<strong>${home.name}</strong><br/>Home Base`)
            .bindTooltip(home.name, {
                permanent: true,
                direction: 'bottom',
                offset: [0, 10],
                className: 'city-label home-label'
            });

        destinations.forEach((dest) => {
            const { direction, offset } = getLabelDirection(dest, allLocations);
            const color = getYearColor(dest.year);

            L.marker([dest.lat, dest.lng], { icon: createDestIcon(dest.year) })
                .addTo(map)
                .bindPopup(`
                    <strong>${dest.conference || dest.name}</strong><br/>
                    ${dest.city}, ${dest.country}<br/>
                    <span style="color: ${color}; font-weight: 600;">${dest.year}</span>
                `)
                .bindTooltip(dest.city, {
                    permanent: true,
                    direction: direction,
                    offset: offset,
                    className: `city-label year-${dest.year}`
                });

            const curvedPath = createCurvedPath(
                [home.lat, home.lng],
                [dest.lat, dest.lng]
            );

            L.polyline(curvedPath, {
                color: color,
                weight: 2,
                opacity: 0.7,
                dashArray: '8, 6',
            }).addTo(map);
        });

        const allPoints: [number, number][] = [
            [home.lat, home.lng],
            ...destinations.map(d => [d.lat, d.lng] as [number, number])
        ];
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50] });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [destinations, home]);

    return (
        <>
            <style jsx global>{`
                .city-label {
                    background: rgba(255, 255, 255, 0.95) !important;
                    border: none !important;
                    border-radius: 4px !important;
                    padding: 2px 8px !important;
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    color: #374151 !important;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.15) !important;
                }
                .city-label::before {
                    display: none !important;
                }
                .dark .city-label {
                    background: rgba(31, 41, 55, 0.95) !important;
                    color: #e5e7eb !important;
                }
                .home-label {
                    background: rgba(16, 185, 129, 0.95) !important;
                    color: white !important;
                }
                .dark .home-label {
                    background: rgba(16, 185, 129, 0.9) !important;
                    color: white !important;
                }
            `}</style>
            <div
                ref={containerRef}
                className="w-full h-[400px]"
                style={{ zIndex: 0 }}
            />
        </>
    );
}
