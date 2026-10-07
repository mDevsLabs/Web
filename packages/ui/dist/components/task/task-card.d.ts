import { type DomainFrameProps } from '../../internal/domain.js';
import type { Task } from './types.js';
export interface TaskCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Task;
}
export declare function TaskCard(props: TaskCardProps): import("react").JSX.Element;
