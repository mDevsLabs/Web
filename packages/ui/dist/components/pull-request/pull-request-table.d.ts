import { type DomainFrameProps } from '../../internal/domain.js';
import type { PullRequest } from './types.js';
export interface PullRequestTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly PullRequest[];
    emptyMessage?: string;
}
export declare function PullRequestTable(props: PullRequestTableProps): import("react").JSX.Element;
