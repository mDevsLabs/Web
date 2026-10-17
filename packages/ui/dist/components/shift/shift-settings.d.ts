import { type DomainFrameProps } from '../../internal/domain.js';
import type { ShiftSettingsValues } from './types.js';
export interface ShiftSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ShiftSettingsValues;
    onChange: (key: keyof ShiftSettingsValues, value: boolean) => void;
}
export declare function ShiftSettings({ onChange, ...props }: ShiftSettingsProps): import("react").JSX.Element;
