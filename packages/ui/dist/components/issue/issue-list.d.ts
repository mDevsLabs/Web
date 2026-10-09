import { type DomainFrameProps } from '../../internal/domain.js';
import type { Issue } from './types.js';
export interface IssueListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Issue[];
    onSelect?: (item: Issue) => void;
    emptyMessage?: string;
}
export declare function IssueList({ onSelect, ...props }: IssueListProps): import("react").JSX.Element;
