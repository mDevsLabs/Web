import { type DomainFrameProps } from '../../internal/domain.js';
import type { Webhook } from './types.js';
export interface WebhookListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Webhook[];
    onSelect?: (item: Webhook) => void;
    emptyMessage?: string;
}
export declare function WebhookList({ onSelect, ...props }: WebhookListProps): import("react").JSX.Element;
