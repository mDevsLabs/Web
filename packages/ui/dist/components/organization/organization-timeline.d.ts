import { type DomainFrameProps } from '../../internal/domain.js';
import type { OrganizationActivity } from './types.js';
export interface OrganizationTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly OrganizationActivity[];
    emptyMessage?: string;
}
export declare function OrganizationTimeline(props: OrganizationTimelineProps): import("react").JSX.Element;
