export declare const config: {
    readonly name: "Team";
    readonly label: "Équipes";
    readonly description: "Gérez vos équipes depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "lead";
        readonly label: "Responsable";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "memberCount";
        readonly label: "Membres";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "department";
        readonly label: "Service";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "forming", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyTeam";
        readonly label: "Notifications : équipes";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveTeam";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section équipes.";
    }, {
        readonly key: "approveTeam";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
