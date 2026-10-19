import { type DomainFrameProps } from '../../internal/domain.js';
import type { Enrollment } from './types.js';
export interface EnrollmentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Enrollment[];
    onSelect?: (item: Enrollment) => void;
    emptyMessage?: string;
}
export declare function EnrollmentList({ onSelect, ...props }: EnrollmentListProps): import("react").JSX.Element;
