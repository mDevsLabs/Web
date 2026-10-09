import { type DomainFrameProps } from '../../internal/domain.js';
import type { WebhookStatus } from './types.js';
export interface WebhookFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: WebhookStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: WebhookStatus | '') => void;
}
export declare function WebhookFilters({ onStatusChange, ...props }: WebhookFiltersProps): import("react").JSX.Element;
