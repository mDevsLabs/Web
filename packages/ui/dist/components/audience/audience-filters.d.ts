import { type DomainFrameProps } from '../../internal/domain.js';
import type { AudienceStatus } from './types.js';
export interface AudienceFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: AudienceStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: AudienceStatus | '') => void;
}
export declare function AudienceFilters({ onStatusChange, ...props }: AudienceFiltersProps): import("react").JSX.Element;
