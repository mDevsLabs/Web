import { type DomainFrameProps } from '../../internal/domain.js';
import type { EventSettingsValues } from './types.js';
export interface EventSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: EventSettingsValues;
    onChange: (key: keyof EventSettingsValues, value: boolean) => void;
}
export declare function EventSettings({ onChange, ...props }: EventSettingsProps): import("react").JSX.Element;
