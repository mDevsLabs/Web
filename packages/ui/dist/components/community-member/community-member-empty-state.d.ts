import { type DomainFrameProps } from '../../internal/domain.js';
export interface CommunityMemberEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function CommunityMemberEmptyState(props: CommunityMemberEmptyStateProps): import("react").JSX.Element;
