export declare const config: {
    readonly name: "Calendar";
    readonly label: "Calendriers";
    readonly description: "Gérez vos calendriers depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "owner";
        readonly label: "Propriétaire";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "eventCount";
        readonly label: "Événements";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "timeZone";
        readonly label: "Fuseau";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "shared", "private"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyCalendar";
        readonly label: "Notifications : calendriers";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveCalendar";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section calendriers.";
    }, {
        readonly key: "approveCalendar";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
