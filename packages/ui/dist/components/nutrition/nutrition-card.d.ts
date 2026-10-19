import { type DomainFrameProps } from '../../internal/domain.js';
import type { Nutrition } from './types.js';
export interface NutritionCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Nutrition;
}
export declare function NutritionCard(props: NutritionCardProps): import("react").JSX.Element;
