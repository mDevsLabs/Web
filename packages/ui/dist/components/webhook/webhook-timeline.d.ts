import { type DomainFrameProps } from '../../internal/domain.js';
import type { WebhookActivity } from './types.js';
export interface WebhookTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly WebhookActivity[];
    emptyMessage?: string;
}
export declare function WebhookTimeline(props: WebhookTimelineProps): import("react").JSX.Element;
