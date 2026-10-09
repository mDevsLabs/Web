import { type DomainFrameProps } from '../../internal/domain.js';
export interface ShiftEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function ShiftEmptyState(props: ShiftEmptyStateProps): import("react").JSX.Element;
