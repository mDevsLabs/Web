// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Database, DatabaseStatus, DatabaseActivity, DatabaseMetric, DatabaseSettingsValues } from './types.js';
export interface DatabaseCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Database;
}
export function DatabaseCard(props: DatabaseCardProps) { return <DomainCard config={config} {...props}/>; }
