import { type DomainFrameProps } from '../../internal/domain.js';
import type { JobPostingSettingsValues } from './types.js';
export interface JobPostingSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: JobPostingSettingsValues;
    onChange: (key: keyof JobPostingSettingsValues, value: boolean) => void;
}
export declare function JobPostingSettings({ onChange, ...props }: JobPostingSettingsProps): import("react").JSX.Element;
