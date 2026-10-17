import { type DomainFrameProps } from '../../internal/domain.js';
import type { DatabaseActivity } from './types.js';
export interface DatabaseTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly DatabaseActivity[];
    emptyMessage?: string;
}
export declare function DatabaseTimeline(props: DatabaseTimelineProps): import("react").JSX.Element;
