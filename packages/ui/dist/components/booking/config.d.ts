export declare const config: {
    readonly name: "Booking";
    readonly label: "Réservations de services";
    readonly description: "Gérez vos réservations de services depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "reference";
        readonly label: "Référence";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "customer";
        readonly label: "Client";
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
        readonly options: readonly ["pending", "confirmed", "cancelled", "completed"];
    }];
    readonly titleKey: "reference";
    readonly settings: readonly [{
        readonly key: "notifyBooking";
        readonly label: "Notifications : réservations de services";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveBooking";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section réservations de services.";
    }, {
        readonly key: "approveBooking";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
