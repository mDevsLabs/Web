import { type DomainFrameProps } from '../../internal/domain.js';
import type { Workout } from './types.js';
export interface WorkoutFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Workout>;
    onSubmit: (value: Omit<Workout, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function WorkoutForm({ onSubmit, ...props }: WorkoutFormProps): import("react").JSX.Element;
