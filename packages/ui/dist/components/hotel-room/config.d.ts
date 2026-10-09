export declare const config: {
    readonly name: "HotelRoom";
    readonly label: "Chambres";
    readonly description: "Gérez vos chambres depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "number";
        readonly label: "Numéro";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "roomType";
        readonly label: "Type";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "nightlyPrice";
        readonly label: "Prix par nuit";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "capacity";
        readonly label: "Capacité";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["available", "occupied", "maintenance"];
    }];
    readonly titleKey: "number";
    readonly settings: readonly [{
        readonly key: "notifyHotelRoom";
        readonly label: "Notifications : chambres";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveHotelRoom";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section chambres.";
    }, {
        readonly key: "approveHotelRoom";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
