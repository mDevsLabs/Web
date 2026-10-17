import { type DomainFrameProps } from '../../internal/domain.js';
import type { DestinationSettingsValues } from './types.js';
export interface DestinationSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: DestinationSettingsValues;
    onChange: (key: keyof DestinationSettingsValues, value: boolean) => void;
}
export declare function DestinationSettings({ onChange, ...props }: DestinationSettingsProps): import("react").JSX.Element;
