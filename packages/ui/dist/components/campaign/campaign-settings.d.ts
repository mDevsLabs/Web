import { type DomainFrameProps } from '../../internal/domain.js';
import type { CampaignSettingsValues } from './types.js';
export interface CampaignSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CampaignSettingsValues;
    onChange: (key: keyof CampaignSettingsValues, value: boolean) => void;
}
export declare function CampaignSettings({ onChange, ...props }: CampaignSettingsProps): import("react").JSX.Element;
