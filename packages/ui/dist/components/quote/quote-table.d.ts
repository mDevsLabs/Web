import { type DomainFrameProps } from '../../internal/domain.js';
import type { Quote } from './types.js';
export interface QuoteTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Quote[];
    emptyMessage?: string;
}
export declare function QuoteTable(props: QuoteTableProps): import("react").JSX.Element;
