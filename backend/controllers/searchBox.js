import zod, { number } from "zod";
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
var tot_doc = 1737;
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
    mag_docs = magDoc.mag_values
      .split(",")
      .map((value) => parseFloat(value.trim()));
    // console.log("Document magnitudes:", mag_docs);

    const idfDoc = await idf.findOne();
    if (!idfDoc || !idfDoc.idf_values) {
      throw new Error("Missing or invalid idf_values data");
    }
    idf_values = idfDoc.idf_values
      .split("\n")
      .map((value) => parseFloat(value.trim()));

    // console.log(idf_values.length);

    const keywordDoc = await Db_Keyword.findOne();
    if (!keywordDoc || !keywordDoc.keyword_values) {
      throw new Error("Missing or invalid keyword data");
    }
    all_keyword = keywordDoc.keyword_values
      .split("\n")
      .map((word) => word.trim());
    // console.log(all_keyword);

    const compressed = await tf_idf.findOne();
    if (!compressed || !compressed.tf_idf_values) {
      console.error("No TF-IDF data found in MongoDB.");
      return null;
    }

    // Decompress the Base64-encoded string
    const decompressedBuffer = zlib.gunzipSync(
      Buffer.from(compressed.tf_idf_values, "base64")
    );
    // console.log("Decompressed Data:", decompressedBuffer.toString('utf-8'));

    // Convert the decompressed string back to a 2D array
    tf_idf_matrix = decompressedBuffer
      .toString("utf-8")
      .split("\n")
      .map((row) =>
        row.split(",").map((value) => {
          const num = parseFloat(value.trim());
          return isNaN(num) ? 0 : num; // Replace NaN with 0
        })
      ); // Convert each value to a number

    console.log("Decompressed TF-IDF matrix retrieved successfully!");
    // console.log(tf_idf_matrix);

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
// console.log("1");

//get the search box body
// const searchBody = zod.object({
//   question: zod.string(),
// });

//fcn to get top results
export const topResults = async (req, res) => {
  console.log("Received request:", req.body);

  if (!isDataLoaded) {
    return res.status(500).json({
      message: "Data is still being loaded. Please try again later.",
    });
  }

  const query_string = req.body.searchInput
    .toLowerCase()
    .replace(/(\r\n|\n|\r)/gm, "");
  const query_keywords = removeStopwords(query_string.split(" ")).sort();

  var mp_query = new Map();
  query_keywords.forEach((ele) => {
    if (mp_query.has(ele)) {
      mp_query.set(ele, mp_query.get(ele) + 1);
    } else {
      mp_query.set(ele, 1);
    }
  });

  //create the tf array of query
  var sz_query_keywords = query_keywords.length;
  var tf_query = [];

  all_keyword.forEach((ele) => {
    if (mp_query.has(ele)) {
      console.log(ele);

      tf_query.push(mp_query.get(ele) / sz_query_keywords);
      console.log(mp_query.get(ele) / sz_query_keywords);
    } else {
      tf_query.push(0);
    }
  });
  // console.log("tf query",tf_query);
  console.log(idf_values.length);
  console.log(tf_query.length);

  //create tf_idf of query
  var tf_idf_query = [];
  for (var i = 0; i < idf_values.length; i++) {
    tf_idf_query.push(tf_query[i] * idf_values[i]);
    if (tf_query[i] * idf_values[i]) {
      console.log(tf_query[i] * idf_values[i]);
    }
  }
  // console.log("tf idf query",tf_idf_query);

  // TF-IDF Matrix for Documents
  // console.log(tf_idf_matrix);

  var tf_idf_doc = [];
  for (var i = 0; i < tot_doc; i++) {
    var values = [];
    for (var j = 0; j < all_keyword.length; j++) {
      let tf_idf_value = tf_idf_matrix[i] ? tf_idf_matrix[i][j] : undefined; // Accessing as a 2D array
      if (tf_idf_value === undefined || isNaN(tf_idf_value)) {
        console.log(
          `Undefined or NaN value at tf_idf_matrix[${i}][${j}]:`,
          tf_idf_value
        );
        values.push(0); // If undefined or NaN, push 0
      } else {
        values.push(tf_idf_value); // Otherwise, push the actual value
      }
    }
    tf_idf_doc.push(values);
  }
  console.log("tf idf doc", tf_idf_doc.length);

  //calculate the magnitude of query vector
  var mag_query = 0;
  for (var i = 0; i < idf_values.length; i++) {
    if (tf_idf_query[i] > 0) {
      mag_query += tf_idf_query[i] * tf_idf_query[i];
    }
  }
  mag_query = Math.sqrt(mag_query);
  console.log("magnitude q:", mag_query);

  //calculate selectivity

  var selectivity_values = new Map();
  for (var i = 0; i < tot_doc; i++) {
    var val = 0;
    for (var j = 0; j < all_keyword.length; j++) {
      if (!isNaN(tf_idf_query[j])) {
        val += tf_idf_doc[i][j] * tf_idf_query[j];
      }
    }

    // Check for zero magnitude before normalizing
    if (mag_docs[i] === 0 || mag_query === 0) {
      // console.log(`Skipping document ${i} due to zero magnitude.`);
      continue; // Skip this document to avoid division by zero
    }

    // Normalize by document magnitude
    val = val / mag_docs[i];
    // Normalize by query magnitude
    val = val / mag_query;

    if (!isNaN(val) && val !== 0) {
      selectivity_values.set(val, i + 1); // Si, doc no.
    } else {
      // console.log(`Skipping document ${i} due to NaN value.`);
    }
  }
  // console.log(selectivity_values);
  

  // Log values to check the results
  // console.log("Selectivity Values (Unsorted):", [
  //   ...selectivity_values.entries(),
  // ]);

  // Sort by similarity score (not by key), in descending order
  var selectivity_order = new Map(
    [...selectivity_values.entries()].sort((a, b) => b[0] - a[0]) // Sort numerically by similarity score
  );

  // Log sorted values
  console.log("Selectivity Values (Sorted):", [...selectivity_order.entries()]);

  // Collect the document IDs (problem_ids) from the sorted map
  var doc_order = [];
  selectivity_order.forEach((key, value) => {
    // console.log(key);
    
    
    doc_order.push(key); // value is the problem_id
    // Check the order
    // console.log("Doc Order:", doc_order);
  });

  var data = [];
  for (var i = 0; i < Math.min(5, doc_order.length); i++) {
    console.log("Fetching data for doc_id:", doc_order[i]);

    // Ensure doc_order[i] matches the type of `problem_id` in the database (e.g., string or number)
    let queryDocId = (doc_order[i]); // Ensure doc_order[i] is a string if `problem_id` is stored as a string

    // Query the database with the correct data type
    let dbData = await all_problem.find({ problem_id: queryDocId });

    // console.log(
    //   `Returned dbData length for doc_id ${queryDocId}:`,
    //   dbData.length
    // );

    // Check if data is found
    if (dbData && dbData.length > 0) {
      // console.log("Fetched Data:", dbData[0]);
      data.push(dbData[0]);
    } else {
      console.log(`No data found for doc_id ${queryDocId}`);
    }
  }

  // Log the data fetched
  console.log("Top Results:", data);

  // Send the response
  res.json({ data });

  // console.log("TF-IDF doc sample:", tf_idf_doc[0]);
};
