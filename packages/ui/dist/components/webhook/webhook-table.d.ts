import { type DomainFrameProps } from '../../internal/domain.js';
import type { Webhook } from './types.js';
export interface WebhookTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Webhook[];
    emptyMessage?: string;
}
export declare function WebhookTable(props: WebhookTableProps): import("react").JSX.Element;
