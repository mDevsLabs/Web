import { type DomainFrameProps } from '../../internal/domain.js';
import type { ContractSettingsValues } from './types.js';
export interface ContractSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ContractSettingsValues;
    onChange: (key: keyof ContractSettingsValues, value: boolean) => void;
}
export declare function ContractSettings({ onChange, ...props }: ContractSettingsProps): import("react").JSX.Element;
