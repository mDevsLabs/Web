import { type DomainFrameProps } from '../../internal/domain.js';
import type { LeaveRequestSettingsValues } from './types.js';
export interface LeaveRequestSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: LeaveRequestSettingsValues;
    onChange: (key: keyof LeaveRequestSettingsValues, value: boolean) => void;
}
export declare function LeaveRequestSettings({ onChange, ...props }: LeaveRequestSettingsProps): import("react").JSX.Element;
