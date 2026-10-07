import { type DomainFrameProps } from '../../internal/domain.js';
import type { Student } from './types.js';
export interface StudentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Student[];
    onSelect?: (item: Student) => void;
    emptyMessage?: string;
}
export declare function StudentList({ onSelect, ...props }: StudentListProps): import("react").JSX.Element;
