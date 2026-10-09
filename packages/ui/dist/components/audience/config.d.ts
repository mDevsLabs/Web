export declare const config: {
    readonly name: "Audience";
    readonly label: "Audiences";
    readonly description: "Gérez vos audiences depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "segment";
        readonly label: "Segment";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "memberCount";
        readonly label: "Membres";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "growthPercent";
        readonly label: "Évolution (%)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "building", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyAudience";
        readonly label: "Notifications : audiences";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveAudience";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section audiences.";
    }, {
        readonly key: "approveAudience";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
