import { type DomainFrameProps } from '../../internal/domain.js';
import type { CommunityMemberSettingsValues } from './types.js';
export interface CommunityMemberSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CommunityMemberSettingsValues;
    onChange: (key: keyof CommunityMemberSettingsValues, value: boolean) => void;
}
export declare function CommunityMemberSettings({ onChange, ...props }: CommunityMemberSettingsProps): import("react").JSX.Element;
