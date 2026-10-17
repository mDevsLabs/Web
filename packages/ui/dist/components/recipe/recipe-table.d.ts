import { type DomainFrameProps } from '../../internal/domain.js';
import type { Recipe } from './types.js';
export interface RecipeTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Recipe[];
    emptyMessage?: string;
}
export declare function RecipeTable(props: RecipeTableProps): import("react").JSX.Element;
