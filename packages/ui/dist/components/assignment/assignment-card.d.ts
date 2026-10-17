import { type DomainFrameProps } from '../../internal/domain.js';
import type { Assignment } from './types.js';
export interface AssignmentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Assignment;
}
export declare function AssignmentCard(props: AssignmentCardProps): import("react").JSX.Element;
