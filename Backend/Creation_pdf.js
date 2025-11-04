import fs from 'fs';
import {writePdf} from "./writePdf.js";

const host = process.env['host'];

let outputPath = null;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
    if (args[i] === '-o' && args[i + 1]) {
        outputPath = args[i + 1];
        i++;
    }
}

async function genererPDF() {
    try {
        const response = await fetch(`${host}`);
        const users = await response.json();

        let ws;
        if (outputPath) {
            ws = fs.createWriteStream(outputPath);
            console.log(`PDF généré : ${outputPath}`);
        } else {
            ws = process.stdout;
        }

        writePdf(users, ws);

    } catch (err) {
        console.error("Erreur:", err);
    }
}

genererPDF();
