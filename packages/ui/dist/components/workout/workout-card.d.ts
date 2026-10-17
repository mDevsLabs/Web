import { type DomainFrameProps } from '../../internal/domain.js';
import type { Workout } from './types.js';
export interface WorkoutCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Workout;
}
export declare function WorkoutCard(props: WorkoutCardProps): import("react").JSX.Element;
