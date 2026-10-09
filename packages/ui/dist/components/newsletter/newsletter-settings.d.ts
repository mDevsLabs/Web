import { type DomainFrameProps } from '../../internal/domain.js';
import type { NewsletterSettingsValues } from './types.js';
export interface NewsletterSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: NewsletterSettingsValues;
    onChange: (key: keyof NewsletterSettingsValues, value: boolean) => void;
}
export declare function NewsletterSettings({ onChange, ...props }: NewsletterSettingsProps): import("react").JSX.Element;
