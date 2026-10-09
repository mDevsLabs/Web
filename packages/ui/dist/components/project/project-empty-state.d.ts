import { type DomainFrameProps } from '../../internal/domain.js';
export interface ProjectEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function ProjectEmptyState(props: ProjectEmptyStateProps): import("react").JSX.Element;
