import { type DomainFrameProps } from '../../internal/domain.js';
import type { Assignment } from './types.js';
export interface AssignmentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Assignment[];
    onSelect?: (item: Assignment) => void;
    emptyMessage?: string;
}
export declare function AssignmentList({ onSelect, ...props }: AssignmentListProps): import("react").JSX.Element;
