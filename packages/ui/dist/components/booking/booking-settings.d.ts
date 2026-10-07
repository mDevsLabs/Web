import { type DomainFrameProps } from '../../internal/domain.js';
import type { BookingSettingsValues } from './types.js';
export interface BookingSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: BookingSettingsValues;
    onChange: (key: keyof BookingSettingsValues, value: boolean) => void;
}
export declare function BookingSettings({ onChange, ...props }: BookingSettingsProps): import("react").JSX.Element;
