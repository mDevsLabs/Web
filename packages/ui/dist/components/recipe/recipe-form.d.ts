import { type DomainFrameProps } from '../../internal/domain.js';
import type { Recipe } from './types.js';
export interface RecipeFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Recipe>;
    onSubmit: (value: Omit<Recipe, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function RecipeForm({ onSubmit, ...props }: RecipeFormProps): import("react").JSX.Element;
