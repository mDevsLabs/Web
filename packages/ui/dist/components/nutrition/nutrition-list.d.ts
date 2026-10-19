import { type DomainFrameProps } from '../../internal/domain.js';
import type { Nutrition } from './types.js';
export interface NutritionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Nutrition[];
    onSelect?: (item: Nutrition) => void;
    emptyMessage?: string;
}
export declare function NutritionList({ onSelect, ...props }: NutritionListProps): import("react").JSX.Element;
