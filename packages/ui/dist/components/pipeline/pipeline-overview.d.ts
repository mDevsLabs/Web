import { type DomainFrameProps } from '../../internal/domain.js';
import type { Pipeline, PipelineMetric } from './types.js';
export interface PipelineOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Pipeline[];
    metrics: readonly PipelineMetric[];
}
export declare function PipelineOverview(props: PipelineOverviewProps): import("react").JSX.Element;
