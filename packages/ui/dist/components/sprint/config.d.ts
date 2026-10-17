export declare const config: {
    readonly name: "Sprint";
    readonly label: "Sprints";
    readonly description: "Gérez vos sprints depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "goal";
        readonly label: "Objectif";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "startDate";
        readonly label: "Début";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "endDate";
        readonly label: "Fin";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["planned", "active", "completed"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifySprint";
        readonly label: "Notifications : sprints";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveSprint";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section sprints.";
    }, {
        readonly key: "approveSprint";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
