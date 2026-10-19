import { type DomainFrameProps } from '../../internal/domain.js';
import type { FeatureFlagStatus } from './types.js';
export interface FeatureFlagFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: FeatureFlagStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: FeatureFlagStatus | '') => void;
}
export declare function FeatureFlagFilters({ onStatusChange, ...props }: FeatureFlagFiltersProps): import("react").JSX.Element;
