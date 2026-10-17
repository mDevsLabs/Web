import { type DomainFrameProps } from '../../internal/domain.js';
import type { Subscription } from './types.js';
export interface SubscriptionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Subscription>;
    onSubmit: (value: Omit<Subscription, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function SubscriptionForm({ onSubmit, ...props }: SubscriptionFormProps): import("react").JSX.Element;
