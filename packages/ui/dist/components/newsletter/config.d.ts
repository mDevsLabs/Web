export declare const config: {
    readonly name: "Newsletter";
    readonly label: "Newsletters";
    readonly description: "Gérez vos newsletters depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "subject";
        readonly label: "Objet";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "sender";
        readonly label: "Expéditeur";
        readonly kind: "email";
        readonly required: true;
    }, {
        readonly key: "recipientCount";
        readonly label: "Destinataires";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "sendOn";
        readonly label: "Envoi";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "scheduled", "sent"];
    }];
    readonly titleKey: "subject";
    readonly settings: readonly [{
        readonly key: "notifyNewsletter";
        readonly label: "Notifications : newsletters";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveNewsletter";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section newsletters.";
    }, {
        readonly key: "approveNewsletter";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
