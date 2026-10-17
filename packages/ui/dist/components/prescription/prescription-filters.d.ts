import { type DomainFrameProps } from '../../internal/domain.js';
import type { PrescriptionStatus } from './types.js';
export interface PrescriptionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: PrescriptionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: PrescriptionStatus | '') => void;
}
export declare function PrescriptionFilters({ onStatusChange, ...props }: PrescriptionFiltersProps): import("react").JSX.Element;
