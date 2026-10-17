import { type DomainFrameProps } from '../../internal/domain.js';
import type { TablePreset } from './types.js';
export interface TablePresetCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: TablePreset;
}
export declare function TablePresetCard(props: TablePresetCardProps): import("react").JSX.Element;
