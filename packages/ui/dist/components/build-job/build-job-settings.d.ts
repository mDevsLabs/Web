import { type DomainFrameProps } from '../../internal/domain.js';
import type { BuildJobSettingsValues } from './types.js';
export interface BuildJobSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: BuildJobSettingsValues;
    onChange: (key: keyof BuildJobSettingsValues, value: boolean) => void;
}
export declare function BuildJobSettings({ onChange, ...props }: BuildJobSettingsProps): import("react").JSX.Element;
