import { type DomainFrameProps } from '../../internal/domain.js';
import type { Newsletter } from './types.js';
export interface NewsletterTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Newsletter[];
    emptyMessage?: string;
}
export declare function NewsletterTable(props: NewsletterTableProps): import("react").JSX.Element;
