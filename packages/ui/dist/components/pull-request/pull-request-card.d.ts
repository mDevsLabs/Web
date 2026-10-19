import { type DomainFrameProps } from '../../internal/domain.js';
import type { PullRequest } from './types.js';
export interface PullRequestCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: PullRequest;
}
export declare function PullRequestCard(props: PullRequestCardProps): import("react").JSX.Element;
