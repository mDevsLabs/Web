import { type DomainFrameProps } from '../../internal/domain.js';
import type { Issue, IssueMetric } from './types.js';
export interface IssueOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Issue[];
    metrics: readonly IssueMetric[];
}
export declare function IssueOverview(props: IssueOverviewProps): import("react").JSX.Element;
