import { type DomainFrameProps } from '../../internal/domain.js';
import type { Campaign } from './types.js';
export interface CampaignFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Campaign>;
    onSubmit: (value: Omit<Campaign, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function CampaignForm({ onSubmit, ...props }: CampaignFormProps): import("react").JSX.Element;
