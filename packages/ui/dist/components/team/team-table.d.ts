import { type DomainFrameProps } from '../../internal/domain.js';
import type { Team } from './types.js';
export interface TeamTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Team[];
    emptyMessage?: string;
}
export declare function TeamTable(props: TeamTableProps): import("react").JSX.Element;
