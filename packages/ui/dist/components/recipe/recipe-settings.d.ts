import { type DomainFrameProps } from '../../internal/domain.js';
import type { RecipeSettingsValues } from './types.js';
export interface RecipeSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: RecipeSettingsValues;
    onChange: (key: keyof RecipeSettingsValues, value: boolean) => void;
}
export declare function RecipeSettings({ onChange, ...props }: RecipeSettingsProps): import("react").JSX.Element;
