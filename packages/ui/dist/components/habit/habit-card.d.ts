import { type DomainFrameProps } from '../../internal/domain.js';
import type { Habit } from './types.js';
export interface HabitCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Habit;
}
export declare function HabitCard(props: HabitCardProps): import("react").JSX.Element;
