import { type DomainFrameProps } from '../../internal/domain.js';
import type { Webhook } from './types.js';
export interface WebhookCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Webhook;
}
export declare function WebhookCard(props: WebhookCardProps): import("react").JSX.Element;
