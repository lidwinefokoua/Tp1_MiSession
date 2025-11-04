import PdfPrinter from "pdfmake";
import {CreerDocument} from "../frontend-vite/src/Etudiant.js";

const fonts = {
    Helvetica: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
    }
};
const printer = new PdfPrinter(fonts);

export function writePdf(users, ws) {
    const docDefinition = CreerDocument(users);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    pdfDoc.pipe(ws);

    pdfDoc.end();
}