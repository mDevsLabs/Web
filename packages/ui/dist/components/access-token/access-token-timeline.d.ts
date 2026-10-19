import { type DomainFrameProps } from '../../internal/domain.js';
import type { AccessTokenActivity } from './types.js';
export interface AccessTokenTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly AccessTokenActivity[];
    emptyMessage?: string;
}
export declare function AccessTokenTimeline(props: AccessTokenTimelineProps): import("react").JSX.Element;
