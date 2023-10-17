const fs   = require('fs');

const fileOnePath = 'PMRS.txt';
const fileSecondPath = 'Base MRS.txt';
const resultFilePath = 'xored.txt';

async function process(fileOnePath, fileSecondPath, resultFilePath) {

    const chunkSize = 64 * 1024; // 64KB

    try {

        const readStream1 = await fs.createReadStream(fileOnePath, {highWaterMark: chunkSize, encoding: 'utf-8'});
        const readStream2 = await fs.createReadStream(fileSecondPath, {highWaterMark: chunkSize, encoding: 'utf-8'});
        const resultStream= fs.createWriteStream(resultFilePath, {encoding: "utf-8"});

        let resultWriter = Promise.resolve();

        while (1) {
            let [buffer1, buffer2] = await Promise.all([
                new Promise((resolve) => {
                    readStream1.once('data', (chunk) => resolve(chunk));
                    readStream1.once('end', () => resolve(null));
                }),
                new Promise((resolve) => {
                    readStream2.once('data', (chunk) => resolve(chunk));
                    readStream2.once('end', () => resolve(null));
                }),
            ]);

            if (!buffer1 || !buffer2) {
                break;
            }

            let result = '';
            const processingLen = Math.min(buffer1.length, buffer2.length);

            for (let i = 0; i < processingLen; i++) {
                result += (buffer1[i] - '0') ^ (buffer2[i] - '0');
            }

            // Remove the processed data from the buffers
            buffer1 = buffer1.slice(processingLen);
            buffer2 = buffer2.slice(processingLen);

            resultWriter = resultWriter.then(() =>
                resultStream.write(result)
            );
        }

        await resultWriter;

        // Close the result stream when done writing
        resultStream.end(() => {
            console.log('XOR operation completed successfully.');
        });

        // Close the input streams when done reading
        readStream1.close();
        readStream2.close();

    } catch (error) {
        console.error('Error:', error.message);
    }
}

process(fileOnePath, fileSecondPath, resultFilePath);