import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReservationSettingsValues } from './types.js';
export interface ReservationSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ReservationSettingsValues;
    onChange: (key: keyof ReservationSettingsValues, value: boolean) => void;
}
export declare function ReservationSettings({ onChange, ...props }: ReservationSettingsProps): import("react").JSX.Element;
