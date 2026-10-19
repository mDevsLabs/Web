import { type DomainFrameProps } from '../../internal/domain.js';
import type { BuildJobActivity } from './types.js';
export interface BuildJobTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly BuildJobActivity[];
    emptyMessage?: string;
}
export declare function BuildJobTimeline(props: BuildJobTimelineProps): import("react").JSX.Element;
