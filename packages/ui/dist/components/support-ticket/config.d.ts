export declare const config: {
    readonly name: "SupportTicket";
    readonly label: "Tickets de support";
    readonly description: "Gérez vos tickets de support depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "subject";
        readonly label: "Objet";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "customer";
        readonly label: "Client";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "priority";
        readonly label: "Priorité";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "createdOn";
        readonly label: "Création";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["open", "in-progress", "resolved", "closed"];
    }];
    readonly titleKey: "subject";
    readonly settings: readonly [{
        readonly key: "notifySupportTicket";
        readonly label: "Notifications : tickets de support";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveSupportTicket";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section tickets de support.";
    }, {
        readonly key: "approveSupportTicket";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
