import { type DomainFrameProps } from '../../internal/domain.js';
import type { Habit } from './types.js';
export interface HabitListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Habit[];
    onSelect?: (item: Habit) => void;
    emptyMessage?: string;
}
export declare function HabitList({ onSelect, ...props }: HabitListProps): import("react").JSX.Element;
