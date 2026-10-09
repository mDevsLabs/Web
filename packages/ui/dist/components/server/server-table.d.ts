import { type DomainFrameProps } from '../../internal/domain.js';
import type { Server } from './types.js';
export interface ServerTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Server[];
    emptyMessage?: string;
}
export declare function ServerTable(props: ServerTableProps): import("react").JSX.Element;
