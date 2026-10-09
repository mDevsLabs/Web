import { type DomainFrameProps } from '../../internal/domain.js';
import type { PullRequest } from './types.js';
export interface PullRequestListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly PullRequest[];
    onSelect?: (item: PullRequest) => void;
    emptyMessage?: string;
}
export declare function PullRequestList({ onSelect, ...props }: PullRequestListProps): import("react").JSX.Element;
