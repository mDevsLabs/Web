export declare const config: {
    readonly name: "Habit";
    readonly label: "Habitudes";
    readonly description: "Gérez vos habitudes depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "frequency";
        readonly label: "Fréquence";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "streakDays";
        readonly label: "Série (jours)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "targetDays";
        readonly label: "Objectif (jours)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "paused", "completed"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyHabit";
        readonly label: "Notifications : habitudes";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveHabit";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section habitudes.";
    }, {
        readonly key: "approveHabit";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
