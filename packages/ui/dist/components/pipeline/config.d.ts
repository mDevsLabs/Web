export declare const config: {
    readonly name: "Pipeline";
    readonly label: "Pipelines";
    readonly description: "Gérez vos pipelines depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "owner";
        readonly label: "Responsable";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "dealCount";
        readonly label: "Opportunités";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "totalValue";
        readonly label: "Valeur totale";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "paused", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyPipeline";
        readonly label: "Notifications : pipelines";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archivePipeline";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section pipelines.";
    }, {
        readonly key: "approvePipeline";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
