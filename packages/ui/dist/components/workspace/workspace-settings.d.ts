import { type DomainFrameProps } from '../../internal/domain.js';
import type { WorkspaceSettingsValues } from './types.js';
export interface WorkspaceSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: WorkspaceSettingsValues;
    onChange: (key: keyof WorkspaceSettingsValues, value: boolean) => void;
}
export declare function WorkspaceSettings({ onChange, ...props }: WorkspaceSettingsProps): import("react").JSX.Element;
