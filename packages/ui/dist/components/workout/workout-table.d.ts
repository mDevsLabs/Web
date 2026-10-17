import { type DomainFrameProps } from '../../internal/domain.js';
import type { Workout } from './types.js';
export interface WorkoutTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Workout[];
    emptyMessage?: string;
}
export declare function WorkoutTable(props: WorkoutTableProps): import("react").JSX.Element;
