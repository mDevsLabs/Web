import { type DomainFrameProps } from '../../internal/domain.js';
import type { TravelItinerarySettingsValues } from './types.js';
export interface TravelItinerarySettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TravelItinerarySettingsValues;
    onChange: (key: keyof TravelItinerarySettingsValues, value: boolean) => void;
}
export declare function TravelItinerarySettings({ onChange, ...props }: TravelItinerarySettingsProps): import("react").JSX.Element;
