import { type DomainFrameProps } from '../../internal/domain.js';
export interface TemplateEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function TemplateEmptyState(props: TemplateEmptyStateProps): import("react").JSX.Element;
