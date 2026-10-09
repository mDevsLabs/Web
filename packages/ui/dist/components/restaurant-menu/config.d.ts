export declare const config: {
    readonly name: "RestaurantMenu";
    readonly label: "Menus de restaurant";
    readonly description: "Gérez vos menus de restaurant depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "restaurant";
        readonly label: "Restaurant";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "dishCount";
        readonly label: "Plats";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "averagePrice";
        readonly label: "Prix moyen";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "active", "seasonal"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyRestaurantMenu";
        readonly label: "Notifications : menus de restaurant";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveRestaurantMenu";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section menus de restaurant.";
    }, {
        readonly key: "approveRestaurantMenu";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
