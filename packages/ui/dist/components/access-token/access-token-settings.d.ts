import { type DomainFrameProps } from '../../internal/domain.js';
import type { AccessTokenSettingsValues } from './types.js';
export interface AccessTokenSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: AccessTokenSettingsValues;
    onChange: (key: keyof AccessTokenSettingsValues, value: boolean) => void;
}
export declare function AccessTokenSettings({ onChange, ...props }: AccessTokenSettingsProps): import("react").JSX.Element;
