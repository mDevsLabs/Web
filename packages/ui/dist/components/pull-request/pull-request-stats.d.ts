import { type DomainFrameProps } from '../../internal/domain.js';
import type { PullRequestMetric } from './types.js';
export interface PullRequestStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly PullRequestMetric[];
}
export declare function PullRequestStats(props: PullRequestStatsProps): import("react").JSX.Element;
