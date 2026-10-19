import { type DomainFrameProps } from '../../internal/domain.js';
import type { TaxReportStatus } from './types.js';
export interface TaxReportFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TaxReportStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TaxReportStatus | '') => void;
}
export declare function TaxReportFilters({ onStatusChange, ...props }: TaxReportFiltersProps): import("react").JSX.Element;
