import { type DomainFrameProps } from '../../internal/domain.js';
import type { AccessTokenStatus } from './types.js';
export interface AccessTokenFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: AccessTokenStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: AccessTokenStatus | '') => void;
}
export declare function AccessTokenFilters({ onStatusChange, ...props }: AccessTokenFiltersProps): import("react").JSX.Element;
