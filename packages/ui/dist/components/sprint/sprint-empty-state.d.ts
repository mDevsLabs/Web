import { type DomainFrameProps } from '../../internal/domain.js';
export interface SprintEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function SprintEmptyState(props: SprintEmptyStateProps): import("react").JSX.Element;
