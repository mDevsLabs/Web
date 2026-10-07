import { type DomainFrameProps } from '../../internal/domain.js';
import type { Habit } from './types.js';
export interface HabitFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Habit>;
    onSubmit: (value: Omit<Habit, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function HabitForm({ onSubmit, ...props }: HabitFormProps): import("react").JSX.Element;
