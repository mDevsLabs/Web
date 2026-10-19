import { type DomainFrameProps } from '../../internal/domain.js';
import type { OrganizationSettingsValues } from './types.js';
export interface OrganizationSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: OrganizationSettingsValues;
    onChange: (key: keyof OrganizationSettingsValues, value: boolean) => void;
}
export declare function OrganizationSettings({ onChange, ...props }: OrganizationSettingsProps): import("react").JSX.Element;
