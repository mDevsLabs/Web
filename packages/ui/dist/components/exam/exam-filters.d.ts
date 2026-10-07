import { type DomainFrameProps } from '../../internal/domain.js';
import type { ExamStatus } from './types.js';
export interface ExamFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ExamStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ExamStatus | '') => void;
}
export declare function ExamFilters({ onStatusChange, ...props }: ExamFiltersProps): import("react").JSX.Element;
