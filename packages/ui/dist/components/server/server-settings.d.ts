import { type DomainFrameProps } from '../../internal/domain.js';
import type { ServerSettingsValues } from './types.js';
export interface ServerSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ServerSettingsValues;
    onChange: (key: keyof ServerSettingsValues, value: boolean) => void;
}
export declare function ServerSettings({ onChange, ...props }: ServerSettingsProps): import("react").JSX.Element;
