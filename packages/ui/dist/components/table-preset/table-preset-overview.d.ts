import { type DomainFrameProps } from '../../internal/domain.js';
import type { TablePreset, TablePresetMetric } from './types.js';
export interface TablePresetOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TablePreset[];
    metrics: readonly TablePresetMetric[];
}
export declare function TablePresetOverview(props: TablePresetOverviewProps): import("react").JSX.Element;
