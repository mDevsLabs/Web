import { type DomainFrameProps } from '../../internal/domain.js';
import type { PipelineMetric } from './types.js';
export interface PipelineStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly PipelineMetric[];
}
export declare function PipelineStats(props: PipelineStatsProps): import("react").JSX.Element;
