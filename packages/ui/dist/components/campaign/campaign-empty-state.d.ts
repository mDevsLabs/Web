import { type DomainFrameProps } from '../../internal/domain.js';
export interface CampaignEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function CampaignEmptyState(props: CampaignEmptyStateProps): import("react").JSX.Element;
