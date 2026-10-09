import { type DomainFrameProps } from '../../internal/domain.js';
import type { Monitor } from './types.js';
export interface MonitorTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Monitor[];
    emptyMessage?: string;
}
export declare function MonitorTable(props: MonitorTableProps): import("react").JSX.Element;
