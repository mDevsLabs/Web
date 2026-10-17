import { type DomainFrameProps } from '../../internal/domain.js';
import type { Quote } from './types.js';
export interface QuoteListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Quote[];
    onSelect?: (item: Quote) => void;
    emptyMessage?: string;
}
export declare function QuoteList({ onSelect, ...props }: QuoteListProps): import("react").JSX.Element;
