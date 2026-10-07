import { type DomainFrameProps } from '../../internal/domain.js';
import type { Sprint, SprintMetric } from './types.js';
export interface SprintOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Sprint[];
    metrics: readonly SprintMetric[];
}
export declare function SprintOverview(props: SprintOverviewProps): import("react").JSX.Element;
