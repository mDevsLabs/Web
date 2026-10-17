import { type DomainFrameProps } from '../../internal/domain.js';
import type { WebhookSettingsValues } from './types.js';
export interface WebhookSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: WebhookSettingsValues;
    onChange: (key: keyof WebhookSettingsValues, value: boolean) => void;
}
export declare function WebhookSettings({ onChange, ...props }: WebhookSettingsProps): import("react").JSX.Element;
