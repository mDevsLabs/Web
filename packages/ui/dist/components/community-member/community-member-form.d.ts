import { type DomainFrameProps } from '../../internal/domain.js';
import type { CommunityMember } from './types.js';
export interface CommunityMemberFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<CommunityMember>;
    onSubmit: (value: Omit<CommunityMember, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function CommunityMemberForm({ onSubmit, ...props }: CommunityMemberFormProps): import("react").JSX.Element;
