import { type DomainFrameProps } from '../../internal/domain.js';
import type { NewsletterStatus } from './types.js';
export interface NewsletterFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: NewsletterStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: NewsletterStatus | '') => void;
}
export declare function NewsletterFilters({ onStatusChange, ...props }: NewsletterFiltersProps): import("react").JSX.Element;
