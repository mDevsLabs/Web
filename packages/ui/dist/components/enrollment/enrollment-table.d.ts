import { type DomainFrameProps } from '../../internal/domain.js';
import type { Enrollment } from './types.js';
export interface EnrollmentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Enrollment[];
    emptyMessage?: string;
}
export declare function EnrollmentTable(props: EnrollmentTableProps): import("react").JSX.Element;
