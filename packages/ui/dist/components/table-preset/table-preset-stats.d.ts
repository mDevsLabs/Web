import { type DomainFrameProps } from '../../internal/domain.js';
import type { TablePresetMetric } from './types.js';
export interface TablePresetStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly TablePresetMetric[];
}
export declare function TablePresetStats(props: TablePresetStatsProps): import("react").JSX.Element;
