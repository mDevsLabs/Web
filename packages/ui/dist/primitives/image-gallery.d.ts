import { type HTMLAttributes } from 'react';
export interface ImageGalleryProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    images: readonly {
        id: string;
        src: string;
        alt: string;
        caption?: string;
    }[];
    value: string;
    onValueChange: (id: string) => void;
}
export declare function ImageGallery({ label, images, value, onValueChange, className, ...props }: ImageGalleryProps): import("react").JSX.Element;
