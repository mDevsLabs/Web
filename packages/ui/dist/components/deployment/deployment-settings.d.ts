import { type DomainFrameProps } from '../../internal/domain.js';
import type { DeploymentSettingsValues } from './types.js';
export interface DeploymentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: DeploymentSettingsValues;
    onChange: (key: keyof DeploymentSettingsValues, value: boolean) => void;
}
export declare function DeploymentSettings({ onChange, ...props }: DeploymentSettingsProps): import("react").JSX.Element;
