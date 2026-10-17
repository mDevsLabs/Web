import { type DomainFrameProps } from '../../internal/domain.js';
import type { EnrollmentSettingsValues } from './types.js';
export interface EnrollmentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: EnrollmentSettingsValues;
    onChange: (key: keyof EnrollmentSettingsValues, value: boolean) => void;
}
export declare function EnrollmentSettings({ onChange, ...props }: EnrollmentSettingsProps): import("react").JSX.Element;
