import { type DomainFrameProps } from '../../internal/domain.js';
import type { Task } from './types.js';
export interface TaskTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Task[];
    emptyMessage?: string;
}
export declare function TaskTable(props: TaskTableProps): import("react").JSX.Element;
