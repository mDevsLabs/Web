import { type DomainFrameProps } from '../../internal/domain.js';
import type { LogEntrySettingsValues } from './types.js';
export interface LogEntrySettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: LogEntrySettingsValues;
    onChange: (key: keyof LogEntrySettingsValues, value: boolean) => void;
}
export declare function LogEntrySettings({ onChange, ...props }: LogEntrySettingsProps): import("react").JSX.Element;
