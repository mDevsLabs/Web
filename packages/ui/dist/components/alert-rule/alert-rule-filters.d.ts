import { type DomainFrameProps } from '../../internal/domain.js';
import type { AlertRuleStatus } from './types.js';
export interface AlertRuleFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: AlertRuleStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: AlertRuleStatus | '') => void;
}
export declare function AlertRuleFilters({ onStatusChange, ...props }: AlertRuleFiltersProps): import("react").JSX.Element;
