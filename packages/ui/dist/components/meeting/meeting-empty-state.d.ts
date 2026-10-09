import { type DomainFrameProps } from '../../internal/domain.js';
export interface MeetingEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function MeetingEmptyState(props: MeetingEmptyStateProps): import("react").JSX.Element;
