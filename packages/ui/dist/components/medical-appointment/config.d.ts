export declare const config: {
    readonly name: "MedicalAppointment";
    readonly label: "Rendez-vous médicaux";
    readonly description: "Gérez vos rendez-vous médicaux depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Objet";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "practitioner";
        readonly label: "Praticien";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "scheduledOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "location";
        readonly label: "Lieu";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["scheduled", "confirmed", "completed", "cancelled"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyMedicalAppointment";
        readonly label: "Notifications : rendez-vous médicaux";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveMedicalAppointment";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section rendez-vous médicaux.";
    }, {
        readonly key: "approveMedicalAppointment";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
