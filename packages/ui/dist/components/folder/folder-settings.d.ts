import { type DomainFrameProps } from '../../internal/domain.js';
import type { FolderSettingsValues } from './types.js';
export interface FolderSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: FolderSettingsValues;
    onChange: (key: keyof FolderSettingsValues, value: boolean) => void;
}
export declare function FolderSettings({ onChange, ...props }: FolderSettingsProps): import("react").JSX.Element;
