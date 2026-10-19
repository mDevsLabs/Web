import { type DomainFrameProps } from '../../internal/domain.js';
import type { Server } from './types.js';
export interface ServerListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Server[];
    onSelect?: (item: Server) => void;
    emptyMessage?: string;
}
export declare function ServerList({ onSelect, ...props }: ServerListProps): import("react").JSX.Element;
