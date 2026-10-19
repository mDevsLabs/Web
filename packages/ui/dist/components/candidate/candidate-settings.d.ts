import { type DomainFrameProps } from '../../internal/domain.js';
import type { CandidateSettingsValues } from './types.js';
export interface CandidateSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CandidateSettingsValues;
    onChange: (key: keyof CandidateSettingsValues, value: boolean) => void;
}
export declare function CandidateSettings({ onChange, ...props }: CandidateSettingsProps): import("react").JSX.Element;
