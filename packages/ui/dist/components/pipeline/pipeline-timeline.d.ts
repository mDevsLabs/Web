import { type DomainFrameProps } from '../../internal/domain.js';
import type { PipelineActivity } from './types.js';
export interface PipelineTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly PipelineActivity[];
    emptyMessage?: string;
}
export declare function PipelineTimeline(props: PipelineTimelineProps): import("react").JSX.Element;
