import { type DomainFrameProps } from '../../internal/domain.js';
import type { IssueMetric } from './types.js';
export interface IssueStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly IssueMetric[];
}
export declare function IssueStats(props: IssueStatsProps): import("react").JSX.Element;
