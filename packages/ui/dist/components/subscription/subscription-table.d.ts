import { type DomainFrameProps } from '../../internal/domain.js';
import type { Subscription } from './types.js';
export interface SubscriptionTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Subscription[];
    emptyMessage?: string;
}
export declare function SubscriptionTable(props: SubscriptionTableProps): import("react").JSX.Element;
