import { type DomainFrameProps } from '../../internal/domain.js';
import type { TablePreset } from './types.js';
export interface TablePresetTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TablePreset[];
    emptyMessage?: string;
}
export declare function TablePresetTable(props: TablePresetTableProps): import("react").JSX.Element;
