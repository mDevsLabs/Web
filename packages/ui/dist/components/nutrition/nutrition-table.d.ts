import { type DomainFrameProps } from '../../internal/domain.js';
import type { Nutrition } from './types.js';
export interface NutritionTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Nutrition[];
    emptyMessage?: string;
}
export declare function NutritionTable(props: NutritionTableProps): import("react").JSX.Element;
