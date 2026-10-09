import { type DomainFrameProps } from '../../internal/domain.js';
import type { ProjectSettingsValues } from './types.js';
export interface ProjectSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ProjectSettingsValues;
    onChange: (key: keyof ProjectSettingsValues, value: boolean) => void;
}
export declare function ProjectSettings({ onChange, ...props }: ProjectSettingsProps): import("react").JSX.Element;
