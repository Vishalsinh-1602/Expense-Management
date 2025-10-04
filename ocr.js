// backend/routes/ocr.js
const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/process-receipt', upload.single('receipt'), async (req, res) => {
    try {
        const { data: { text } } = await Tesseract.recognize(
            req.file.path,
            'eng',
            { logger: m => console.log(m) }
        );

        // Basic text parsing (you'd want more sophisticated parsing)
        const lines = text.split('\n');
        const amountMatch = text.match(/(\d+[.,]\d{2})/);
        const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);

        const parsedData = {
            amount: amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null,
            date: dateMatch ? dateMatch[1] : null,
            description: lines[0] || '',
            rawText: text
        };

        res.json(parsedData);
    } catch (error) {
        console.error('OCR processing error:', error);
        res.status(500).json({ message: 'Error processing receipt' });
    }
});

module.exports = router;