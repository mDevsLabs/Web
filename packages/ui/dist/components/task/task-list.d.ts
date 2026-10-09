import { type DomainFrameProps } from '../../internal/domain.js';
import type { Task } from './types.js';
export interface TaskListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Task[];
    onSelect?: (item: Task) => void;
    emptyMessage?: string;
}
export declare function TaskList({ onSelect, ...props }: TaskListProps): import("react").JSX.Element;
