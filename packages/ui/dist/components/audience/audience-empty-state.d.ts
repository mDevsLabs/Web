import { type DomainFrameProps } from '../../internal/domain.js';
export interface AudienceEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function AudienceEmptyState(props: AudienceEmptyStateProps): import("react").JSX.Element;
