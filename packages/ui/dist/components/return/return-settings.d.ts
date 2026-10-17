import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReturnSettingsValues } from './types.js';
export interface ReturnSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ReturnSettingsValues;
    onChange: (key: keyof ReturnSettingsValues, value: boolean) => void;
}
export declare function ReturnSettings({ onChange, ...props }: ReturnSettingsProps): import("react").JSX.Element;
