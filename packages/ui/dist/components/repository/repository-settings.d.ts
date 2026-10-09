import { type DomainFrameProps } from '../../internal/domain.js';
import type { RepositorySettingsValues } from './types.js';
export interface RepositorySettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: RepositorySettingsValues;
    onChange: (key: keyof RepositorySettingsValues, value: boolean) => void;
}
export declare function RepositorySettings({ onChange, ...props }: RepositorySettingsProps): import("react").JSX.Element;
