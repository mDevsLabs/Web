import { type DomainFrameProps } from '../../internal/domain.js';
export interface CandidateEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function CandidateEmptyState(props: CandidateEmptyStateProps): import("react").JSX.Element;
