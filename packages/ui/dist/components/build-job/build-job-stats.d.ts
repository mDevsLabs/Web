import { type DomainFrameProps } from '../../internal/domain.js';
import type { BuildJobMetric } from './types.js';
export interface BuildJobStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly BuildJobMetric[];
}
export declare function BuildJobStats(props: BuildJobStatsProps): import("react").JSX.Element;
