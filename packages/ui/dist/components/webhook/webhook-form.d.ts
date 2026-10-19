import { type DomainFrameProps } from '../../internal/domain.js';
import type { Webhook } from './types.js';
export interface WebhookFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Webhook>;
    onSubmit: (value: Omit<Webhook, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function WebhookForm({ onSubmit, ...props }: WebhookFormProps): import("react").JSX.Element;
