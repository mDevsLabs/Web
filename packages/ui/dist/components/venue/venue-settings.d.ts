import { type DomainFrameProps } from '../../internal/domain.js';
import type { VenueSettingsValues } from './types.js';
export interface VenueSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: VenueSettingsValues;
    onChange: (key: keyof VenueSettingsValues, value: boolean) => void;
}
export declare function VenueSettings({ onChange, ...props }: VenueSettingsProps): import("react").JSX.Element;
