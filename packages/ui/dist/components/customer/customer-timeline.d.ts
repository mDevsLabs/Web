import { type DomainFrameProps } from '../../internal/domain.js';
import type { CustomerActivity } from './types.js';
export interface CustomerTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CustomerActivity[];
    emptyMessage?: string;
}
export declare function CustomerTimeline(props: CustomerTimelineProps): import("react").JSX.Element;
