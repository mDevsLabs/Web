import { type DomainFrameProps } from '../../internal/domain.js';
import type { EnvironmentSettingsValues } from './types.js';
export interface EnvironmentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: EnvironmentSettingsValues;
    onChange: (key: keyof EnvironmentSettingsValues, value: boolean) => void;
}
export declare function EnvironmentSettings({ onChange, ...props }: EnvironmentSettingsProps): import("react").JSX.Element;
