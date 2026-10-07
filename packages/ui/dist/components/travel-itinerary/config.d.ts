export declare const config: {
    readonly name: "TravelItinerary";
    readonly label: "Itinéraires";
    readonly description: "Gérez vos itinéraires depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "traveler";
        readonly label: "Voyageur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "startsOn";
        readonly label: "Début";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "dayCount";
        readonly label: "Jours";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "confirmed", "completed"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyTravelItinerary";
        readonly label: "Notifications : itinéraires";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveTravelItinerary";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section itinéraires.";
    }, {
        readonly key: "approveTravelItinerary";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
