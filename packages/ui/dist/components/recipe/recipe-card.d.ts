import { type DomainFrameProps } from '../../internal/domain.js';
import type { Recipe } from './types.js';
export interface RecipeCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Recipe;
}
export declare function RecipeCard(props: RecipeCardProps): import("react").JSX.Element;
