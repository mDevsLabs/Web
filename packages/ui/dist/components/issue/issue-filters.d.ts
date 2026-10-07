import { type DomainFrameProps } from '../../internal/domain.js';
import type { IssueStatus } from './types.js';
export interface IssueFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: IssueStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: IssueStatus | '') => void;
}
export declare function IssueFilters({ onStatusChange, ...props }: IssueFiltersProps): import("react").JSX.Element;
