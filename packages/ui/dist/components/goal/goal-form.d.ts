import { type DomainFrameProps } from '../../internal/domain.js';
import type { Goal } from './types.js';
export interface GoalFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Goal>;
    onSubmit: (value: Omit<Goal, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function GoalForm({ onSubmit, ...props }: GoalFormProps): import("react").JSX.Element;
