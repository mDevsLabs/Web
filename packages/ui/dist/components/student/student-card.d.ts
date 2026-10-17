import { type DomainFrameProps } from '../../internal/domain.js';
import type { Student } from './types.js';
export interface StudentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Student;
}
export declare function StudentCard(props: StudentCardProps): import("react").JSX.Element;
