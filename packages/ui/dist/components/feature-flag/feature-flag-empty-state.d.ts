import { type DomainFrameProps } from '../../internal/domain.js';
export interface FeatureFlagEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function FeatureFlagEmptyState(props: FeatureFlagEmptyStateProps): import("react").JSX.Element;
