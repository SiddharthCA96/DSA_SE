import mongoose from "mongoose";
import { idf, tf_idf, Db_Keyword, Db_mag, all_problem } from "../db/index.js";
import fs from "fs/promises";

mongoose.connect('mongodb+srv://ss6156852:ZCUwQ7HGO2u7IJjm@cluster0.sr1uz.mongodb.net/DSA_SE')
    .then(() => console.log("DB connected"))
    .catch(err => console.error("DB connection error:", err));

// Function to put data into MongoDB
async function processData() {
    // Reading files
    const all_keywds = (await fs.readFile('all_keywords.txt', 'utf-8')).split('\n');
    const idf_str = await fs.readFile('idf_value.txt', 'utf-8');
    const tf_idf_matrix = (await fs.readFile('tf_idf_Matrix.txt', 'utf-8')).split('\n');
    const problem_titles = (await fs.readFile('leetcode_prob_titles.txt', 'utf-8')).split('\n');
    const problem_urls = (await fs.readFile('leetcode_prob_url.txt', 'utf-8')).split('\n');
    const problem_desc = await Promise.all(
        Array.from({ length: 1737 }, (_, i) => fs.readFile(`Corpus/leet_prob${i + 1}.txt`, 'utf-8'))
    );

    // Save all keywords to the database
    await Db_Keyword.create({ keyword_values: all_keywds.join('\n') });
    console.log("All keywords saved!");

    // Save IDF values to the database
    await idf.create({ idf_values: idf_str });
    console.log("IDF values saved!");

    // Save TF-IDF matrix to the database
    await tf_idf.create({ tf_idf_values: tf_idf_matrix.join('\n') });
    console.log("TF-IDF matrix saved!");

    // Initialize variables for problems and magnitudes
    const tot_keywds = all_keywds.length;
    const mag_docs = [];
    const problems = [];

    // Calculate magnitudes and prepare problem data
    for (let i = 0; i < 1737; i++) {
        let value = 0;
        for (let j = 0; j < tot_keywds; j++) {
            const tfidf = parseFloat(tf_idf_matrix[i * tot_keywds + j]) || 0;
            value += tfidf ** 2;
        }
        const magnitude = Math.sqrt(value);
        mag_docs.push(magnitude);

        problems.push({
            problem_desc: problem_desc[i],
            problem_title: problem_titles[i],
            problem_url: problem_urls[i],
            problem_mag: magnitude,
            problem_id: i + 1,
        });
    }

    // Save all problems to the database
    await all_problem.insertMany(problems);
    console.log("All problems saved!");

    // Save magnitudes to the database
    await Db_mag.create({ mag_values: mag_docs.join(',') });
    console.log("Magnitudes saved!");
}

// Execute the function and handle errors
processData()
    .then(() => console.log("Data processing completed successfully!"))
    .catch(err => console.error("Error in processing data:", err));
