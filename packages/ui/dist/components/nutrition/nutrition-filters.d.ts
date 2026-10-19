import { type DomainFrameProps } from '../../internal/domain.js';
import type { NutritionStatus } from './types.js';
export interface NutritionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: NutritionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: NutritionStatus | '') => void;
}
export declare function NutritionFilters({ onStatusChange, ...props }: NutritionFiltersProps): import("react").JSX.Element;
