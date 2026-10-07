export declare const config: {
    readonly name: "Warehouse";
    readonly label: "Entrepôts";
    readonly description: "Gérez vos entrepôts depuis une interface claire.";
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
        readonly key: "occupancy";
        readonly label: "Occupation";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "maintenance", "closed"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyWarehouse";
        readonly label: "Notifications : entrepôts";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveWarehouse";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section entrepôts.";
    }, {
        readonly key: "approveWarehouse";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
