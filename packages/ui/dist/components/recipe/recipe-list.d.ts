import { type DomainFrameProps } from '../../internal/domain.js';
import type { Recipe } from './types.js';
export interface RecipeListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Recipe[];
    onSelect?: (item: Recipe) => void;
    emptyMessage?: string;
}
export declare function RecipeList({ onSelect, ...props }: RecipeListProps): import("react").JSX.Element;
