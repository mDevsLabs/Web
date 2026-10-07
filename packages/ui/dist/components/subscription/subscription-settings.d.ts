import { type DomainFrameProps } from '../../internal/domain.js';
import type { SubscriptionSettingsValues } from './types.js';
export interface SubscriptionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: SubscriptionSettingsValues;
    onChange: (key: keyof SubscriptionSettingsValues, value: boolean) => void;
}
export declare function SubscriptionSettings({ onChange, ...props }: SubscriptionSettingsProps): import("react").JSX.Element;
