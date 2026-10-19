import { type DomainFrameProps } from '../../internal/domain.js';
import type { CalendarSettingsValues } from './types.js';
export interface CalendarSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CalendarSettingsValues;
    onChange: (key: keyof CalendarSettingsValues, value: boolean) => void;
}
export declare function CalendarSettings({ onChange, ...props }: CalendarSettingsProps): import("react").JSX.Element;
