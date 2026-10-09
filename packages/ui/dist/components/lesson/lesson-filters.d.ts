import { type DomainFrameProps } from '../../internal/domain.js';
import type { LessonStatus } from './types.js';
export interface LessonFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: LessonStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: LessonStatus | '') => void;
}
export declare function LessonFilters({ onStatusChange, ...props }: LessonFiltersProps): import("react").JSX.Element;
