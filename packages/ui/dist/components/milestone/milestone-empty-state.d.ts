import { type DomainFrameProps } from '../../internal/domain.js';
export interface MilestoneEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function MilestoneEmptyState(props: MilestoneEmptyStateProps): import("react").JSX.Element;
