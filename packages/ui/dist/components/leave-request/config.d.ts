export declare const config: {
    readonly name: "LeaveRequest";
    readonly label: "Congés";
    readonly description: "Gérez vos congés depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "employee";
        readonly label: "Collaborateur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "leaveType";
        readonly label: "Type";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "startDate";
        readonly label: "Début";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "endDate";
        readonly label: "Fin";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["pending", "approved", "rejected"];
    }];
    readonly titleKey: "employee";
    readonly settings: readonly [{
        readonly key: "notifyLeaveRequest";
        readonly label: "Notifications : congés";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveLeaveRequest";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section congés.";
    }, {
        readonly key: "approveLeaveRequest";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
