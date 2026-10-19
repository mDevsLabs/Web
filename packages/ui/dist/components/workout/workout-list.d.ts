import { type DomainFrameProps } from '../../internal/domain.js';
import type { Workout } from './types.js';
export interface WorkoutListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Workout[];
    onSelect?: (item: Workout) => void;
    emptyMessage?: string;
}
export declare function WorkoutList({ onSelect, ...props }: WorkoutListProps): import("react").JSX.Element;
