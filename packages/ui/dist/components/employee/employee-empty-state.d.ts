import { type DomainFrameProps } from '../../internal/domain.js';
export interface EmployeeEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function EmployeeEmptyState(props: EmployeeEmptyStateProps): import("react").JSX.Element;
