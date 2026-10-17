import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Pipeline = {
    id?: string;
    name: string;
    owner: string;
    dealCount: number;
    totalValue: number;
    status: "active" | "paused" | "archived";
};
export type PipelineStatus = Pipeline['status'];
export interface PipelineActivity extends DomainActivity {
    pipelineId?: string;
}
export type PipelineMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalPipeline' | 'activePipeline' | 'valuePipeline';
};
export type PipelineSettingsValues = Partial<Record<"notifyPipeline" | "archivePipeline" | "approvePipeline", boolean>>;
