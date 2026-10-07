import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Roadmap = {
    id?: string;
    name: string;
    owner: string;
    quarter: string;
    initiativeCount: number;
    status: "draft" | "published" | "archived";
};
export type RoadmapStatus = Roadmap['status'];
export interface RoadmapActivity extends DomainActivity {
    roadmapId?: string;
}
export type RoadmapMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalRoadmap' | 'activeRoadmap' | 'valueRoadmap';
};
export type RoadmapSettingsValues = Partial<Record<"notifyRoadmap" | "archiveRoadmap" | "approveRoadmap", boolean>>;
