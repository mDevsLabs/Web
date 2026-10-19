import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReturnActivity } from './types.js';
export interface ReturnTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ReturnActivity[];
    emptyMessage?: string;
}
export declare function ReturnTimeline(props: ReturnTimelineProps): import("react").JSX.Element;
