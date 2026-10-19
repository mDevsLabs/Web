import { type DomainFrameProps } from '../../internal/domain.js';
import type { TablePresetSettingsValues } from './types.js';
export interface TablePresetSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TablePresetSettingsValues;
    onChange: (key: keyof TablePresetSettingsValues, value: boolean) => void;
}
export declare function TablePresetSettings({ onChange, ...props }: TablePresetSettingsProps): import("react").JSX.Element;
