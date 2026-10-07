import { type DomainFrameProps } from '../../internal/domain.js';
import type { Assignment } from './types.js';
export interface AssignmentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Assignment[];
    emptyMessage?: string;
}
export declare function AssignmentTable(props: AssignmentTableProps): import("react").JSX.Element;
