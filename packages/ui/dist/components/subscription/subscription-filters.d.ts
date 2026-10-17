import { type DomainFrameProps } from '../../internal/domain.js';
import type { SubscriptionStatus } from './types.js';
export interface SubscriptionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: SubscriptionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: SubscriptionStatus | '') => void;
}
export declare function SubscriptionFilters({ onStatusChange, ...props }: SubscriptionFiltersProps): import("react").JSX.Element;
