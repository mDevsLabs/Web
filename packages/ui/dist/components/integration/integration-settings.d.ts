import { type DomainFrameProps } from '../../internal/domain.js';
import type { IntegrationSettingsValues } from './types.js';
export interface IntegrationSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: IntegrationSettingsValues;
    onChange: (key: keyof IntegrationSettingsValues, value: boolean) => void;
}
export declare function IntegrationSettings({ onChange, ...props }: IntegrationSettingsProps): import("react").JSX.Element;
