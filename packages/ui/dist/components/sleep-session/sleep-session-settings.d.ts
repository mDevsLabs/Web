import { type DomainFrameProps } from '../../internal/domain.js';
import type { SleepSessionSettingsValues } from './types.js';
export interface SleepSessionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: SleepSessionSettingsValues;
    onChange: (key: keyof SleepSessionSettingsValues, value: boolean) => void;
}
export declare function SleepSessionSettings({ onChange, ...props }: SleepSessionSettingsProps): import("react").JSX.Element;
