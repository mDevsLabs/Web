import { type DomainFrameProps } from '../../internal/domain.js';
import type { Quote } from './types.js';
export interface QuoteCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Quote;
}
export declare function QuoteCard(props: QuoteCardProps): import("react").JSX.Element;
