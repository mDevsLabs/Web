import { type DomainFrameProps } from '../../internal/domain.js';
import type { MedicalAppointmentSettingsValues } from './types.js';
export interface MedicalAppointmentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: MedicalAppointmentSettingsValues;
    onChange: (key: keyof MedicalAppointmentSettingsValues, value: boolean) => void;
}
export declare function MedicalAppointmentSettings({ onChange, ...props }: MedicalAppointmentSettingsProps): import("react").JSX.Element;
