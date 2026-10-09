import { type DomainFrameProps } from '../../internal/domain.js';
import type { Audience } from './types.js';
export interface AudienceListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Audience[];
    onSelect?: (item: Audience) => void;
    emptyMessage?: string;
}
export declare function AudienceList({ onSelect, ...props }: AudienceListProps): import("react").JSX.Element;
