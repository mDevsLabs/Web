export declare const config: {
    readonly name: "Venue";
    readonly label: "Lieux";
    readonly description: "Gérez vos lieux depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "city";
        readonly label: "Ville";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "capacity";
        readonly label: "Capacité";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "dailyRate";
        readonly label: "Tarif journalier";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["available", "booked", "closed"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyVenue";
        readonly label: "Notifications : lieux";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveVenue";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section lieux.";
    }, {
        readonly key: "approveVenue";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
