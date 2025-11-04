export function CreerDocument(users) {
    const body = [];
    body.push([
        { text: "#", style: "tableHeader" },
        { text: "Prénom", style: "tableHeader" },
        { text: "Nom", style: "tableHeader" },
        { text: "Courriel", style: "tableHeader" }
    ]);

    users.forEach((u, i) => {
        body.push([
            { text: (i + 1).toString(), alignment: "center" },
            { text: u.first_name || "—", style: "cellText" },
            { text: u.last_name || "—", style: "cellText" },
            { text: u.email || "—", style: "cellText" }
        ]);
    });

    return {
        defaultStyle: { font: "Helvetica", fontSize: 11, lineHeight: 1.4 },

        pageOrientation: "portrait",
        pageMargins: [40, 80, 40, 60],

        background: function () {
            return {
                canvas: [
                    {
                        type: "rect",
                        x: 0,
                        y: 0,
                        w: 595,
                        h: 60,
                        color: "#004aad"
                    }
                ]
            };
        },

        header: {
            columns: [
                {
                    text: "Lid&Ash - Gestion des Étudiants",
                    style: "headerLeft"
                },
                {
                    text: "Rapport PDF",
                    alignment: "right",
                    style: "headerRight"
                }
            ],
            margin: [40, 20, 40, 0]
        },

        footer: function (currentPage, pageCount) {
            return {
                columns: [
                    { text: "© Lid&Ash — Tous droits réservés", style: "footerLeft" },
                    {
                        text: `Page ${currentPage} sur ${pageCount}`,
                        alignment: "right",
                        style: "footerRight"
                    }
                ],
                margin: [40, 0, 40, 20]
            };
        },

        content: [
            {
                text: "Rapport des Étudiants",
                style: "mainTitle",
                margin: [0, 20, 0, 5]
            },
            {
                text: `Total : ${users.length} étudiant${users.length > 1 ? "s" : ""}`,
                style: "subTitle",
                margin: [0, 0, 0, 15]
            },

            // Tableau stylé
            {
                table: {
                    headerRows: 1,
                    widths: [30, "*", "*", "auto"],
                    body: body
                },
                layout: {
                    fillColor: function (rowIndex) {
                        return rowIndex === 0
                            ? "#004aad" // en-tête bleu
                            : rowIndex % 2 === 0
                                ? "#f6f8fb" // alternance clair
                                : null;
                    },
                    hLineWidth: () => 0.6,
                    vLineWidth: () => 0.6,
                    hLineColor: () => "#c2c8d1",
                    vLineColor: () => "#c2c8d1",
                    paddingLeft: () => 8,
                    paddingRight: () => 8,
                    paddingTop: () => 5,
                    paddingBottom: () => 5
                }
            },

            {
                text: `\n\nGénéré le ${new Date().toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                })}`,
                style: "dateText",
                alignment: "right"
            }
        ],

        styles: {
            mainTitle: {
                fontSize: 20,
                bold: true,
                color: "#004aad",
                alignment: "center",
                decoration: "underline"
            },
            subTitle: {
                fontSize: 12,
                color: "#555",
                italics: true,
                alignment: "center"
            },
            headerLeft: {
                fontSize: 12,
                bold: true,
                color: "#ffffff"
            },
            headerRight: {
                fontSize: 10,
                italics: true,
                color: "#e6e6e6"
            },
            tableHeader: {
                bold: true,
                color: "white",
                alignment: "center",
                fontSize: 11
            },
            cellText: {
                color: "#333",
                fontSize: 10
            },
            dateText: {
                fontSize: 9,
                color: "#777",
                italics: true
            },
            footerLeft: {
                fontSize: 9,
                color: "#777"
            },
            footerRight: {
                fontSize: 9,
                color: "#777"
            }
        }
    };
}
