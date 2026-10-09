import { type DomainFrameProps } from '../../internal/domain.js';
import type { AudienceActivity } from './types.js';
export interface AudienceTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly AudienceActivity[];
    emptyMessage?: string;
}
export declare function AudienceTimeline(props: AudienceTimelineProps): import("react").JSX.Element;
