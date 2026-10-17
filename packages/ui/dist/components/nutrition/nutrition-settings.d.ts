import { type DomainFrameProps } from '../../internal/domain.js';
import type { NutritionSettingsValues } from './types.js';
export interface NutritionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: NutritionSettingsValues;
    onChange: (key: keyof NutritionSettingsValues, value: boolean) => void;
}
export declare function NutritionSettings({ onChange, ...props }: NutritionSettingsProps): import("react").JSX.Element;
