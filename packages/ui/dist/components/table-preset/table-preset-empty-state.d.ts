import { type DomainFrameProps } from '../../internal/domain.js';
export interface TablePresetEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function TablePresetEmptyState(props: TablePresetEmptyStateProps): import("react").JSX.Element;
