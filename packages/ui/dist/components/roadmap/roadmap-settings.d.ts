import { type DomainFrameProps } from '../../internal/domain.js';
import type { RoadmapSettingsValues } from './types.js';
export interface RoadmapSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: RoadmapSettingsValues;
    onChange: (key: keyof RoadmapSettingsValues, value: boolean) => void;
}
export declare function RoadmapSettings({ onChange, ...props }: RoadmapSettingsProps): import("react").JSX.Element;
