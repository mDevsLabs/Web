import { type DomainFrameProps } from '../../internal/domain.js';
import type { Audience } from './types.js';
export interface AudienceTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Audience[];
    emptyMessage?: string;
}
export declare function AudienceTable(props: AudienceTableProps): import("react").JSX.Element;
