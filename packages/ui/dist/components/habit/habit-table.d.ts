import { type DomainFrameProps } from '../../internal/domain.js';
import type { Habit } from './types.js';
export interface HabitTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Habit[];
    emptyMessage?: string;
}
export declare function HabitTable(props: HabitTableProps): import("react").JSX.Element;
