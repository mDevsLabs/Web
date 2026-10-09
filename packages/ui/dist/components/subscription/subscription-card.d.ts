import { type DomainFrameProps } from '../../internal/domain.js';
import type { Subscription } from './types.js';
export interface SubscriptionCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Subscription;
}
export declare function SubscriptionCard(props: SubscriptionCardProps): import("react").JSX.Element;
