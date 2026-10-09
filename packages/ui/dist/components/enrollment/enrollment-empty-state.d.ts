import { type DomainFrameProps } from '../../internal/domain.js';
export interface EnrollmentEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function EnrollmentEmptyState(props: EnrollmentEmptyStateProps): import("react").JSX.Element;
