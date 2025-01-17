import zod from "zod";
import mongoose from "mongoose";
import zlib from "zlib";
import { tf_idf, idf, Db_Keyword, Db_mag, all_problem } from "../db/index.js";
import { removeStopwords } from "stopword";

mongoose
  .connect(
    "mongodb+srv://ss6156852:ZCUwQ7HGO2u7IJjm@cluster0.sr1uz.mongodb.net/DSA_SE"
  )
  .then(() => console.log("DB connected"))
  .catch((err) => console.error("DB connection error:", err));

//variables
let all_keyword = [];
let mag_docs = [];
let idf_values = [];
let tf_idf_matrix = [];
let isDataLoaded = false; // Flag to check if data is loaded

// Function to load data from MongoDB
mongoose
  .connect(
    "mongodb+srv://ss6156852:ZCUwQ7HGO2u7IJjm@cluster0.sr1uz.mongodb.net/DSA_SE",
    { useNewUrlParser: true, useUnifiedTopology: true, bufferTimeoutMS: 20000 }
  )
  .then(() => console.log("DB connected"))
  .catch((err) => console.error("DB connection error:", err));

const loadData = async () => {
  try {
    const magDoc = await Db_mag.findOne();
    if (!magDoc || !magDoc.mag_values) {
      throw new Error("Missing or invalid mag_docs data");
    }
    mag_docs = magDoc.mag_values.split(",");

    const idfDoc = await idf.findOne();
    if (!idfDoc || !idfDoc.idf_values) {
      throw new Error("Missing or invalid idf_values data");
    }
    idf_values = idfDoc.idf_values.split(",");

    const keywordDoc = await Db_Keyword.findOne();
    if (!keywordDoc || !keywordDoc.keyword_values) {
      throw new Error("Missing or invalid keyword data");
    }
    all_keyword = keywordDoc.keyword_values.split(",");

    const compressed = await tf_idf.findOne();
    if (compressed) {
      tf_idf_matrix = zlib
        .gunzipSync(Buffer.from(compressed.tf_idf_values, "base64"))
        .toString("utf-8")
        .split(",");
    }

    isDataLoaded = true;
    console.log("Data loaded successfully");
  } catch (error) {
    console.error("Error loading data:", error);
  }
};

(async () => {
  try {
    await loadData();
    console.log("Data is ready");
  } catch (error) {
    console.error("Initialization error:", error);
  }
})();
console.log("1");

//get the search box body
// const searchBody = zod.object({
//   question: zod.string(),
// });

//fcn to get top results
export const topResults = async (req, res) => {
  console.log("2");
  // Check if data is loaded before proceeding
  if (!isDataLoaded) {
    return res.status(500).json({
      message: "Data is still being loaded. Please try again later.",
    });
  }
  console.log("inside topres");

  // const { success } = searchBody.safeParse(req.body);
  // if (!success) {
  //   return res.status(411).json({
  //     message: "Incorrect inputs of query",
  //   });
  // }
  console.log(req.body.searchInput);

  const query_string = req.body.searchInput.toLowerCase().replace(/(\r\n|\n|\r)/gm, "");
  const query_keywords = removeStopwords(query_string.split(" ")).sort();
  // console.log(query_string);

  // console.log(typeof(all_keyword));
  
  // Term Frequency (TF) Calculation for Query
  const mp_query = query_keywords.reduce((map, word) => {
    map.set(word, (map.get(word) || 0) + 1);
    return map;
  }, new Map());

  const tf_query = all_keyword.map((word) =>
    mp_query.has(word) ? mp_query.get(word) / query_keywords.length : 0
  );

  // TF-IDF Calculation for Query
  const tf_idf_query = tf_query.map((tf, i) => tf * idf_values[i]);
  const mag_query = Math.sqrt(
    tf_idf_query.reduce((sum, val) => sum + val * val, 0)
  );

  // TF-IDF Matrix for Documents
  const tot_doc = mag_docs.length;
  const tf_idf_doc = Array.from({ length: tot_doc }, (_, i) =>
    all_keyword.map((_, j) =>
      tf_idf_matrix[all_keyword.length * i + j] === "NUN"
        ? 0
        : tf_idf_matrix[all_keyword.length * i + j]
    )
  );

  // Cosine Similarity Calculation
  const selectivity_values = tf_idf_doc.map((doc_vector, i) => {
    const dot_product = doc_vector.reduce(
      (sum, val, j) => sum + val * tf_idf_query[j],
      0
    );
    return { score: dot_product / (mag_docs[i] * mag_query), doc_id: i + 1 };
  });

  // Sort by Selectivity Scores
  selectivity_values.sort((a, b) => b.score - a.score);

  // Fetch Top 5 Results from Database
  const doc_order = selectivity_values.slice(0, 5).map((entry) => entry.doc_id);
  const data = await all_problem.find({ problem_id: { $in: doc_order } });

  console.log(data);
  res.json({ data }); // Send the results as response
};
