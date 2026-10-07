// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Environment, EnvironmentStatus, EnvironmentActivity, EnvironmentMetric, EnvironmentSettingsValues } from './types.js';
export interface EnvironmentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Environment;
}
export function EnvironmentCard(props: EnvironmentCardProps) { return <DomainCard config={config} {...props}/>; }
