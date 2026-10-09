import { type DomainFrameProps } from '../../internal/domain.js';
import type { DatabaseSettingsValues } from './types.js';
export interface DatabaseSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: DatabaseSettingsValues;
    onChange: (key: keyof DatabaseSettingsValues, value: boolean) => void;
}
export declare function DatabaseSettings({ onChange, ...props }: DatabaseSettingsProps): import("react").JSX.Element;
