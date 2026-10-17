import { type DomainFrameProps } from '../../internal/domain.js';
import type { Budget } from './types.js';
export interface BudgetFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Budget>;
    onSubmit: (value: Omit<Budget, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function BudgetForm({ onSubmit, ...props }: BudgetFormProps): import("react").JSX.Element;
