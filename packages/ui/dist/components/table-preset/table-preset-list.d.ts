import { type DomainFrameProps } from '../../internal/domain.js';
import type { TablePreset } from './types.js';
export interface TablePresetListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TablePreset[];
    onSelect?: (item: TablePreset) => void;
    emptyMessage?: string;
}
export declare function TablePresetList({ onSelect, ...props }: TablePresetListProps): import("react").JSX.Element;
