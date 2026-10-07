import { type DomainFrameProps } from '../../internal/domain.js';
export interface NutritionEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function NutritionEmptyState(props: NutritionEmptyStateProps): import("react").JSX.Element;
