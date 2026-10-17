import { type DomainFrameProps } from '../../internal/domain.js';
import type { BackupSettingsValues } from './types.js';
export interface BackupSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: BackupSettingsValues;
    onChange: (key: keyof BackupSettingsValues, value: boolean) => void;
}
export declare function BackupSettings({ onChange, ...props }: BackupSettingsProps): import("react").JSX.Element;
