export declare const config: {
    readonly name: "Meeting";
    readonly label: "Réunions";
    readonly description: "Gérez vos réunions depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "host";
        readonly label: "Organisateur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "scheduledOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "durationMinutes";
        readonly label: "Durée (min)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["scheduled", "ongoing", "completed", "cancelled"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyMeeting";
        readonly label: "Notifications : réunions";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveMeeting";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section réunions.";
    }, {
        readonly key: "approveMeeting";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
