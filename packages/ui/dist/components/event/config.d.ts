export declare const config: {
    readonly name: "Event";
    readonly label: "Événements";
    readonly description: "Gérez vos événements depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "location";
        readonly label: "Lieu";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "startsOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "attendeeCount";
        readonly label: "Participants";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "scheduled", "cancelled", "completed"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyEvent";
        readonly label: "Notifications : événements";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveEvent";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section événements.";
    }, {
        readonly key: "approveEvent";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
