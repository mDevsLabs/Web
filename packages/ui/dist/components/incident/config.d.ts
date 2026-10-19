export declare const config: {
    readonly name: "Incident";
    readonly label: "Incidents";
    readonly description: "Gérez vos incidents depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "severity";
        readonly label: "Sévérité";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "startedOn";
        readonly label: "Début";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "affectedUsers";
        readonly label: "Utilisateurs impactés";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["investigating", "identified", "monitoring", "resolved"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyIncident";
        readonly label: "Notifications : incidents";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveIncident";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section incidents.";
    }, {
        readonly key: "approveIncident";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
