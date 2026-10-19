import { type DomainFrameProps } from '../../internal/domain.js';
import type { Newsletter } from './types.js';
export interface NewsletterListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Newsletter[];
    onSelect?: (item: Newsletter) => void;
    emptyMessage?: string;
}
export declare function NewsletterList({ onSelect, ...props }: NewsletterListProps): import("react").JSX.Element;
