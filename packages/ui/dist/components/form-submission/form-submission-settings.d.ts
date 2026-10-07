import { type DomainFrameProps } from '../../internal/domain.js';
import type { FormSubmissionSettingsValues } from './types.js';
export interface FormSubmissionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: FormSubmissionSettingsValues;
    onChange: (key: keyof FormSubmissionSettingsValues, value: boolean) => void;
}
export declare function FormSubmissionSettings({ onChange, ...props }: FormSubmissionSettingsProps): import("react").JSX.Element;
