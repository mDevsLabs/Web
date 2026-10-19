import { type DomainFrameProps } from '../../internal/domain.js';
import type { RecipeStatus } from './types.js';
export interface RecipeFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: RecipeStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: RecipeStatus | '') => void;
}
export declare function RecipeFilters({ onStatusChange, ...props }: RecipeFiltersProps): import("react").JSX.Element;
