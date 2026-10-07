import { type DomainFrameProps } from '../../internal/domain.js';
export interface HabitEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function HabitEmptyState(props: HabitEmptyStateProps): import("react").JSX.Element;
