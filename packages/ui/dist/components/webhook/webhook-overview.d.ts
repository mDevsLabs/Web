import { type DomainFrameProps } from '../../internal/domain.js';
import type { Webhook, WebhookMetric } from './types.js';
export interface WebhookOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Webhook[];
    metrics: readonly WebhookMetric[];
}
export declare function WebhookOverview(props: WebhookOverviewProps): import("react").JSX.Element;
