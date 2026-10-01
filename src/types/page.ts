export interface BasePageConfig {
    type: 'about' | 'publication' | 'card' | 'text' | 'gallery' | 'services';
    title: string;
    description?: string;
}

export interface GalleryPhoto {
    src: string;
    caption?: string;
    conference: string;
    year?: string;
}

export interface TravelDestination {
    name: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
    year: string;
    conference?: string;
}

export interface GalleryPageConfig extends BasePageConfig {
    type: 'gallery';
    intro?: string;
    photos: GalleryPhoto[];
    destinations?: TravelDestination[];
    homeCity?: { name: string; lat: number; lng: number };
}

export interface PublicationPageConfig extends BasePageConfig {
    type: 'publication';
    source: string;
}

export interface TextPageConfig extends BasePageConfig {
    type: 'text';
    source: string;
}

export interface CardItem {
    title: string;
    subtitle?: string;
    date?: string;
    content?: string;
    tags?: string[];
    link?: string;
    image?: string;
}

export interface CardPageConfig extends BasePageConfig {
    type: 'card';
    items: CardItem[];
}

export interface ServiceItem {
    conference: string;
    year: number;
    note?: string;
    icon?: string;
}

export interface ServiceRole {
    role: string;
    items: ServiceItem[];
}

export interface ServicesPageConfig extends BasePageConfig {
    type: 'services';
    roles: ServiceRole[];
}
