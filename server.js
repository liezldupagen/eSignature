// server.js

const express = require('express');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const multer  = require('multer');
const upload = multer();

const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.post('/populate-signature', upload.single('signatureImagePath'), async (req, res) => {
    const { pdfPath, signatureFieldName, outputPath } = req.body;
    const signatureImage = req.file; // Get the uploaded image file
    try {
        await populateSignatureField(pdfPath, signatureImage, signatureFieldName, outputPath);
        res.status(200).send('Signature populated successfully');
    } catch (error) {
        console.error('Error populating signature:', error);
        res.status(500).send('Failed to populate signature');
    }
});

async function populateSignatureField(pdfPath, signatureImage, outputPath) {
    try {
        const pdfBytes = await fs.readFile(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        // Get the first page of the PDF (assuming there's only one page)
        const targetPage = pages[15];

        // Load the signature image
        const signatureImageBytes = signatureImage.buffer; // Use the buffer property to get the file data

        // Add the image to the page
        const image = await pdfDoc.embedPng(signatureImageBytes);
        const imageSize = image.scale(0.5); // Adjust the scale as needed

        // Get the width and height of the image
        const width = imageSize.width;
        const height = imageSize.height;

        // Draw the image at a specific position
        targetPage.drawImage(image, {
            x: 180, // Adjust the x position as needed
            y: 210, // Adjust the y position as needed
            width,
            height,
        });

        // Save the modified PDF
        const modifiedPdfBytes = await pdfDoc.save();
        await fs.writeFile(outputPath, modifiedPdfBytes);

        console.log('Signature populated successfully');
    } catch (error) {
        console.error('Error populating signature:', error);
        throw error;
    }
}

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
