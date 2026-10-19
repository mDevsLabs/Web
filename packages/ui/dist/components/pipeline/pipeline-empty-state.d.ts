import { type DomainFrameProps } from '../../internal/domain.js';
export interface PipelineEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function PipelineEmptyState(props: PipelineEmptyStateProps): import("react").JSX.Element;
