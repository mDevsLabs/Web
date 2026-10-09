import { type DomainFrameProps } from '../../internal/domain.js';
import type { PipelineSettingsValues } from './types.js';
export interface PipelineSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: PipelineSettingsValues;
    onChange: (key: keyof PipelineSettingsValues, value: boolean) => void;
}
export declare function PipelineSettings({ onChange, ...props }: PipelineSettingsProps): import("react").JSX.Element;
