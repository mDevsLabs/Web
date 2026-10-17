import { type DomainFrameProps } from '../../internal/domain.js';
import type { TablePresetActivity } from './types.js';
export interface TablePresetTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly TablePresetActivity[];
    emptyMessage?: string;
}
export declare function TablePresetTimeline(props: TablePresetTimelineProps): import("react").JSX.Element;
