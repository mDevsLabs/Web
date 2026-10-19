import { type DomainFrameProps } from '../../internal/domain.js';
import type { MonitorSettingsValues } from './types.js';
export interface MonitorSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: MonitorSettingsValues;
    onChange: (key: keyof MonitorSettingsValues, value: boolean) => void;
}
export declare function MonitorSettings({ onChange, ...props }: MonitorSettingsProps): import("react").JSX.Element;
