import { type DomainFrameProps } from '../../internal/domain.js';
import type { FeatureFlag } from './types.js';
export interface FeatureFlagFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<FeatureFlag>;
    onSubmit: (value: Omit<FeatureFlag, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function FeatureFlagForm({ onSubmit, ...props }: FeatureFlagFormProps): import("react").JSX.Element;
