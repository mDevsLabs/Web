import { type DomainFrameProps } from '../../internal/domain.js';
import type { BuildJob, BuildJobMetric } from './types.js';
export interface BuildJobOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly BuildJob[];
    metrics: readonly BuildJobMetric[];
}
export declare function BuildJobOverview(props: BuildJobOverviewProps): import("react").JSX.Element;
