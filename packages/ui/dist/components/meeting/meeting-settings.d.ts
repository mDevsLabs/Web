import { type DomainFrameProps } from '../../internal/domain.js';
import type { MeetingSettingsValues } from './types.js';
export interface MeetingSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: MeetingSettingsValues;
    onChange: (key: keyof MeetingSettingsValues, value: boolean) => void;
}
export declare function MeetingSettings({ onChange, ...props }: MeetingSettingsProps): import("react").JSX.Element;
