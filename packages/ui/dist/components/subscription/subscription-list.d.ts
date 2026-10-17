import { type DomainFrameProps } from '../../internal/domain.js';
import type { Subscription } from './types.js';
export interface SubscriptionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Subscription[];
    onSelect?: (item: Subscription) => void;
    emptyMessage?: string;
}
export declare function SubscriptionList({ onSelect, ...props }: SubscriptionListProps): import("react").JSX.Element;
