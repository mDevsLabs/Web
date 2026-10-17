import { type DomainFrameProps } from '../../internal/domain.js';
import type { HotelRoomSettingsValues } from './types.js';
export interface HotelRoomSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: HotelRoomSettingsValues;
    onChange: (key: keyof HotelRoomSettingsValues, value: boolean) => void;
}
export declare function HotelRoomSettings({ onChange, ...props }: HotelRoomSettingsProps): import("react").JSX.Element;
