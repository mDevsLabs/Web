import { type DomainFrameProps } from '../../internal/domain.js';
import type { Expense } from './types.js';
export interface ExpenseFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Expense>;
    onSubmit: (value: Omit<Expense, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ExpenseForm({ onSubmit, ...props }: ExpenseFormProps): import("react").JSX.Element;
