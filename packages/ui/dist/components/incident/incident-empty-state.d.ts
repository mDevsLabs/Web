import { type DomainFrameProps } from '../../internal/domain.js';
export interface IncidentEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function IncidentEmptyState(props: IncidentEmptyStateProps): import("react").JSX.Element;
