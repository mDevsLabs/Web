import { type DomainFrameProps } from '../../internal/domain.js';
import type { SupportTicketSettingsValues } from './types.js';
export interface SupportTicketSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: SupportTicketSettingsValues;
    onChange: (key: keyof SupportTicketSettingsValues, value: boolean) => void;
}
export declare function SupportTicketSettings({ onChange, ...props }: SupportTicketSettingsProps): import("react").JSX.Element;
