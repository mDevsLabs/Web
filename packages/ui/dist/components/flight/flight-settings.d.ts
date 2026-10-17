import { type DomainFrameProps } from '../../internal/domain.js';
import type { FlightSettingsValues } from './types.js';
export interface FlightSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: FlightSettingsValues;
    onChange: (key: keyof FlightSettingsValues, value: boolean) => void;
}
export declare function FlightSettings({ onChange, ...props }: FlightSettingsProps): import("react").JSX.Element;
