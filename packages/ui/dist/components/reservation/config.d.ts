export declare const config: {
    readonly name: "Reservation";
    readonly label: "Réservations hôtelières";
    readonly description: "Gérez vos réservations hôtelières depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "reference";
        readonly label: "Référence";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "guest";
        readonly label: "Voyageur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "checkIn";
        readonly label: "Arrivée";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "checkOut";
        readonly label: "Départ";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["pending", "confirmed", "checked-in", "completed"];
    }];
    readonly titleKey: "reference";
    readonly settings: readonly [{
        readonly key: "notifyReservation";
        readonly label: "Notifications : réservations hôtelières";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveReservation";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section réservations hôtelières.";
    }, {
        readonly key: "approveReservation";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
