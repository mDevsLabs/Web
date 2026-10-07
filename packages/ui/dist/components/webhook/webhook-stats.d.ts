import { type DomainFrameProps } from '../../internal/domain.js';
import type { WebhookMetric } from './types.js';
export interface WebhookStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly WebhookMetric[];
}
export declare function WebhookStats(props: WebhookStatsProps): import("react").JSX.Element;
