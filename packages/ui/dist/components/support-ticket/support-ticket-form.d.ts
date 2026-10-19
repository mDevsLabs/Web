import { type DomainFrameProps } from '../../internal/domain.js';
import type { SupportTicket } from './types.js';
export interface SupportTicketFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<SupportTicket>;
    onSubmit: (value: Omit<SupportTicket, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function SupportTicketForm({ onSubmit, ...props }: SupportTicketFormProps): import("react").JSX.Element;
