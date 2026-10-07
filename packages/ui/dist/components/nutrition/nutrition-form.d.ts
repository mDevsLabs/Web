import { type DomainFrameProps } from '../../internal/domain.js';
import type { Nutrition } from './types.js';
export interface NutritionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Nutrition>;
    onSubmit: (value: Omit<Nutrition, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function NutritionForm({ onSubmit, ...props }: NutritionFormProps): import("react").JSX.Element;
