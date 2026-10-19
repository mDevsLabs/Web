import { type DomainFrameProps } from '../../internal/domain.js';
import type { BankAccount } from './types.js';
export interface BankAccountFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<BankAccount>;
    onSubmit: (value: Omit<BankAccount, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function BankAccountForm({ onSubmit, ...props }: BankAccountFormProps): import("react").JSX.Element;
