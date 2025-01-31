const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const express = require('express');
const cheerio = require('cheerio');
const natural = require('natural');
const morgan = require('morgan');
const http = require('http');
const nlp = require('compromise');
const { rejects } = require('assert');
const stopwords = require('stopword');
const url = require("url");
const { log } = require('console');
const { connected } = require('process');
const app = express();
const port = 3000;
app.use(morgan('dev'));
let text1, text2;
let preprocessed1, preprocessed2;
let keywords1 = '', keywords2 = '';
let filecount = 0, processcount = 0;
let plagiarismPercentage = 0;
let similarWords = 0;
app.use(express.static(path.join(__dirname, 'public')));
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
let tfidfSimilarity,ngramsSimilarity ;
const getRepeatedWords = (words) => {
    let word = JSON.parse(JSON.stringify(words));
    const filteredWords = word.filter(word => !/^\d+$/.test(word) && (word.length > 2 && word.length < 10));

    const wordCounts = filteredWords.reduce((counts, word) => {
        counts[word] = (counts[word] || 0) + 1;
        return counts;
    }, {});

    const sortedWords = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a]);
    const top10Words = sortedWords.slice(0, 10);

    return top10Words;

};

function calculatePlagiarismPercentage(similarities, weights) {

    const totalWeight = Object.values(weights).reduce((acc, weight) => {
        return acc + weight;
    }, 0);
    const weightedSum = Object.keys(similarities).reduce((sum, key) => {
        if (similarities[key] !== undefined) {
            const termWeight = weights[key] / totalWeight;
            return sum + similarities[key] * termWeight;
        }
        return sum;
    }, 0);
    const plagiarismPercentage = (weightedSum * 100).toFixed(2);
    return plagiarismPercentage;
}
function calculateTFIDF(texts) {
    const tfidf = new natural.TfIdf();

    texts.forEach((text) => {
        tfidf.addDocument(new natural.WordTokenizer().tokenize(text));
    });

    const features = texts.map(() => {
        const tfidfVector = {};
        tfidf.listTerms(0).forEach((termInfo) => {
            tfidfVector[termInfo.term] = termInfo.tfidf;
        });
        return tfidfVector;
    });

    return features;
}
function euclideanDistance(vectorA, vectorB) {
    return Math.sqrt(
        Object.keys(vectorA).reduce((sum, term) => {
            const diff = vectorA[term] - (vectorB[term] || 0);
            return sum + diff ** 2;
        }, 0)
    );
}
function calculateNgrams(text, n) {
    const words = text.split(' ');
    const ngrams = [];

    for (let i = 0; i <= words.length - n; i++) {
        const ngram = words.slice(i, i + n).join(' ');
        ngrams.push(ngram);
    }

    return ngrams;
}
function cosineSimilarity(vectorA, vectorB) {
    const dotProduct = Object.keys(vectorA).reduce((sum, term) => {
        return sum + (vectorA[term] || 0) * (vectorB[term] || 0);
    }, 0);

    const magnitudeA = Math.sqrt(Object.values(vectorA).reduce((sum, tfidf) => sum + Math.pow(tfidf || 0, 2), 0));
    const magnitudeB = Math.sqrt(Object.values(vectorB).reduce((sum, tfidf) => sum + Math.pow(tfidf || 0, 2), 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
}
function jaccardSimilarity(setA, setB) {
    const intersection = setA.filter(value => setB.includes(value));
    const union = [...new Set([...setA, ...setB])];
    return intersection.length / union.length;
}


async function compareDocuments(text1, text2) {
    // let sim = text1.filter(word => text2.includes(word));
    similarWords = sim.length;
    const tfidfFeatures = calculateTFIDF([text1, text2]);
    // console.log(tfidfFeatures);
    const ngramsFeatures = [
        calculateNgrams(text1, 1),
        calculateNgrams(text2, 1),
    ];
    console.log(tfidfFeatures[0]);
    const features1 = {
        tfidf: tfidfFeatures[0],
        ngrams: ngramsFeatures[0],
    };

    const features2 = {
        tfidf: tfidfFeatures[1],
        ngrams: ngramsFeatures[1],
    };

    const tfidfSimilarity = cosineSimilarity(features1.tfidf, features2.tfidf);
    const ngramsSimilarity = jaccardSimilarity(features1.ngrams, features2.ngrams);
    const euclideanDistanceTFIDF = euclideanDistance(features1.tfidf, features2.tfidf);

    let similarities = {
        tfidfSimilarity,
        ngramsSimilarity,
        euclideanDistanceTFIDF,
    };

    const weights = {
        tfidfSimilarity: 0.4,
        ngramsSimilarity: 0.3,
        euclideanDistanceTFIDF: 0.2,
    };

    plagiarismPercentage = calculatePlagiarismPercentage(similarities, weights);
    plagiarismPercentage = plagiarismPercentage > 100 ? 100 : plagiarismPercentage;
    console.log(`Plagiarism Percentage: ${plagiarismPercentage}%`);
}


async function uploadtext(keywords1, keywords2, plagiarismPercentage, l1, l2, sim) {
    const filePath = 'nodejs\\public\\index2.html';
    return new Promise(async (resolve, reject) => {
        try {
            console.log('Reading the HTML file...');
            const data = await fs.readFile(filePath, 'utf8');

            const $ = cheerio.load(data);

            const key1 = $('#keywords1');
            const key2 = $('#keywords2');
            const palagrism = $('#palagrism');
            const len1 = $('#wordcount1');
            const len2 = $('#wordcount2');
            const similar = $('wordcnt')

            key1.html(`<h3>Keywords :${keywords1}</h3>`)
            key2.html(`<h3>Keywords :${keywords2}</h3>`)
            palagrism.html(`<h2> ${plagiarismPercentage}% <br /> palagrism </h2>`)
            len1.html(` <h3>Word Count : ${l1}words</h3>`)
            len2.html(` <h3>Word Count : ${l2}words</h3>`)
            similar.html(`<h3>Similar Words <br>${sim}</h3>`)
            await fs.writeFile(filePath, $.html(), 'utf8');
            await fs.writeFile(filePath1, `const a=${tfidfSimilarity}*100,b=${plagiarismPercentage},c=${ngramsSimilarity}*100;
            let cp=document.getElementById('a'),pv=document.getElementById('b');
            let cp1=document.getElementById('a1'),pv1=document.getElementById('b1');
            let cp2=document.getElementById('a2'),pv2=document.getElementById('b2');
            let psv=0,pev=100,speed=50;
            let progress=setInterval(()=>{
                psv++;
                if(psv<=a){
                pv.textContent=psv+"%";
                cp.style.background="conic-gradient(#0766ad "+ psv*3.6+"deg,#e0f4ff 0deg)";
                }
                if(psv<=b){
                pv1.textContent=psv+"%";
                cp1.style.background="conic-gradient(#0766ad  "+psv*3.6+"deg,#e0f4ff 0deg)";
                }
                if(psv<=c){
                pv2.textContent=psv+"%";
                cp2.style.background="conic-gradient(#0766ad "+psv*3.6+"deg,#e0f4ff 0deg)";
                }
                if(psv==pev){
                    clearInterval(progress);
                }
            },speed);`, 'utf8');
            resolve();
            console.log('HTML file has been successfully modified.');
        } catch (err) {
            reject();
            console.error('Error:', err);
        }
    });
}
async function preprocessText(text) {
    try {
        processcount++;
        text = text.replace(/\s+/g, ' ').trim();
        text = text.replace(/[^a-zA-Z0-9\s]/g, '');
        const words = text.split(/\s+/);
        const filtered = stopwords.removeStopwords(words);
        if (processcount == 1) {
            text1 = filtered;
        } else {
            text2 = filtered;
        }
        const unique = [...new Set(filtered)];
        text = unique.join(' ');
        return text;

    } catch (error) {
        console.error('Error processing text:', error);
        throw error;
    }
}

//pdf to text
async function extractTextFromPDF(buffer) {
    const data = await pdf(buffer);
    return JSON.stringify(data.text);
}
//docx to text
async function extractTextFromDOCX(buffer) {
    const result = await mammoth.extractRawText(buffer);
    return JSON.stringify(result.value);
}
//file1 handling
async function handleFileUpload1(req, res) {
    const uploadedFile = req.file;
    if (!uploadedFile) {
        return res.status(400).send('No file uploaded.');
    }
    const fileType = uploadedFile.mimetype;
    try {
        let extractedText;
        if (fileType === 'application/pdf') {
            extractedText = await extractTextFromPDF(uploadedFile.buffer);
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            extractedText = await extractTextFromDOCX(uploadedFile);
        } else if (fileType === 'text/plain') {
            extractedText = uploadedFile.buffer.toString('utf-8');
        } else {
            return res.status(400).send('Unsupported file type.');
        }
        filecount++;
        preprocessed1 = await preprocessText(extractedText);
        if (filecount == 2) {
            keywords1 = getRepeatedWords(text1);
            keywords2 = getRepeatedWords(text2);
            await compareDocuments(text1, text2);
            uploadtext(keywords1, keywords2, plagiarismPercentage, text1.length, text2.length, similarWords)
        }
        console.log('Mission1 complete');
    } catch (error) {
        console.error('Error extracting text:', error);
        res.status(500).send('Internal Server Error');
    }
}
//file 2 handling
async function handleFileUpload2(req, res) {
    const uploadedFile = req.file;
    if (!uploadedFile) {
        return res.status(400).send('No file uploaded.');
    }
    const fileType = uploadedFile.mimetype;
    try {
        let extractedText;
        if (fileType === 'application/pdf') {
            extractedText = await extractTextFromPDF(uploadedFile.buffer);
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            extractedText = await extractTextFromDOCX(uploadedFile);
        } else if (fileType === 'text/plain') {
            extractedText = uploadedFile.buffer.toString('utf-8');
        } else {
            return res.status(400).send('Unsupported file type.');
        }
        filecount++;
        preprocessed2 = await preprocessText(extractedText);
        if (filecount == 2) {
            keywords1 = getRepeatedWords(text1);
            keywords2 = getRepeatedWords(text2);
            await compareDocuments(text1, text2);
            uploadtext(keywords1, keywords2, plagiarismPercentage, text1.length, text2.length, similarWords)
        }
        console.log('Mission2 complete');
    } catch (error) {
        console.error('Error extracting text:', error);
        res.status(500).send('Internal Server Error');
    }

}
app.use((req, res, next) => {
    filecount = 0;
    processcount = 0;
    next();
});
app.post('/file1', upload.single('file'), handleFileUpload1);
app.post('/file2', upload.single('file'), handleFileUpload2);
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});