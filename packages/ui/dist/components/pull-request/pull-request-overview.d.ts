import { type DomainFrameProps } from '../../internal/domain.js';
import type { PullRequest, PullRequestMetric } from './types.js';
export interface PullRequestOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly PullRequest[];
    metrics: readonly PullRequestMetric[];
}
export declare function PullRequestOverview(props: PullRequestOverviewProps): import("react").JSX.Element;
