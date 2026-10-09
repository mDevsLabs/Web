export declare const config: {
    readonly name: "SleepSession";
    readonly label: "Sommeil";
    readonly description: "Gérez vos sommeil depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Session";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "date";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "durationHours";
        readonly label: "Durée (h)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "qualityScore";
        readonly label: "Qualité";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["logged", "reviewed", "archived"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifySleepSession";
        readonly label: "Notifications : sommeil";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveSleepSession";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section sommeil.";
    }, {
        readonly key: "approveSleepSession";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
