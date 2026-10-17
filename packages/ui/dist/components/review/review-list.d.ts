import { type DomainFrameProps } from '../../internal/domain.js';
import type { Review } from './types.js';
export interface ReviewListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Review[];
    onSelect?: (item: Review) => void;
    emptyMessage?: string;
}
export declare function ReviewList({ onSelect, ...props }: ReviewListProps): import("react").JSX.Element;
