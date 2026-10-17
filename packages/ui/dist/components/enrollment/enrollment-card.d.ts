import { type DomainFrameProps } from '../../internal/domain.js';
import type { Enrollment } from './types.js';
export interface EnrollmentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Enrollment;
}
export declare function EnrollmentCard(props: EnrollmentCardProps): import("react").JSX.Element;
