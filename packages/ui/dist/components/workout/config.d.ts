export declare const config: {
    readonly name: "Workout";
    readonly label: "Entraînements";
    readonly description: "Gérez vos entraînements depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "activity";
        readonly label: "Activité";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "durationMinutes";
        readonly label: "Durée (min)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "calories";
        readonly label: "Calories";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["planned", "completed", "skipped"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyWorkout";
        readonly label: "Notifications : entraînements";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveWorkout";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section entraînements.";
    }, {
        readonly key: "approveWorkout";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
