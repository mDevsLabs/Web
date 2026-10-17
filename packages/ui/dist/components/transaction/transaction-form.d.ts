import { type DomainFrameProps } from '../../internal/domain.js';
import type { Transaction } from './types.js';
export interface TransactionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Transaction>;
    onSubmit: (value: Omit<Transaction, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function TransactionForm({ onSubmit, ...props }: TransactionFormProps): import("react").JSX.Element;
