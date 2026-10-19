import { type DomainFrameProps } from '../../internal/domain.js';
import type { Roadmap } from './types.js';
export interface RoadmapFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Roadmap>;
    onSubmit: (value: Omit<Roadmap, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function RoadmapForm({ onSubmit, ...props }: RoadmapFormProps): import("react").JSX.Element;
