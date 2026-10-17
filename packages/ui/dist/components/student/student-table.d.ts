import { type DomainFrameProps } from '../../internal/domain.js';
import type { Student } from './types.js';
export interface StudentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Student[];
    emptyMessage?: string;
}
export declare function StudentTable(props: StudentTableProps): import("react").JSX.Element;
