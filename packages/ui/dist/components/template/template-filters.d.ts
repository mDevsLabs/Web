import { type DomainFrameProps } from '../../internal/domain.js';
import type { TemplateStatus } from './types.js';
export interface TemplateFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TemplateStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TemplateStatus | '') => void;
}
export declare function TemplateFilters({ onStatusChange, ...props }: TemplateFiltersProps): import("react").JSX.Element;
