
import mongoose from "mongoose";
import zlib from "zlib";
import { tf_idf, idf, Db_Keyword, Db_mag, all_problem } from "../db/index.js";
import { removeStopwords } from "stopword";
import dotenv from "dotenv";
dotenv.config();

export const MONGO_URI = process.env.MONGO_URI;


mongoose
  .connect(
    MONGO_URI
  )
  .then(() => console.log("DB connected"))
  .catch((err) => console.error("DB connection error:", err));

//variables
let all_keyword = [];
let mag_docs = [];
let idf_values = [];
let tf_idf_matrix = [];
var tot_doc = 2500;
let isDataLoaded = false; // Flag to check if data is loaded

const loadData = async () => {
  try {
    const magDoc = await Db_mag.findOne();
    if (!magDoc || !magDoc.mag_values) {
      throw new Error("Missing or invalid mag_docs data");
    }
    mag_docs = magDoc.mag_values
      .split(",")
      .map((value) => parseFloat(value.trim()));
    const idfDoc = await idf.findOne();
    if (!idfDoc || !idfDoc.idf_values) {
      throw new Error("Missing or invalid idf_values data");
    }
    idf_values = idfDoc.idf_values
      .split("\n")
      .map((value) => parseFloat(value.trim()));

    const keywordDoc = await Db_Keyword.findOne();
    if (!keywordDoc || !keywordDoc.keyword_values) {
      throw new Error("Missing or invalid keyword data");
    }
    all_keyword = keywordDoc.keyword_values
      .split("\n")
      .map((word) => word.trim());

    const compressed = await tf_idf.findOne();
    if (!compressed || !compressed.tf_idf_values) {
      console.error("No TF-IDF data found in MongoDB.");
      return null;
    }
    
    // Decompress the Base64-encoded string
    const decompressedBuffer = zlib.gunzipSync(
      Buffer.from(compressed.tf_idf_values, "base64")
    );

    // Convert the decompressed string back to a 2D array
    tf_idf_matrix = decompressedBuffer
      .toString("utf-8")
      .split("\n")
      .map((row) =>
        row.split(",").map((value) => {
          const num = parseFloat(value.trim());
          return isNaN(num) ? 0 : num; // Replace NaN with 0
        })
      ); // Convert each value to a numbe

    isDataLoaded = true;
  } catch (error) {
    console.error("Error loading data:", error);
  }
};

(async () => {
  try {
    await loadData();

  } catch (error) {
    console.error("Initialization error:", error);
  }
})();

//fcn to get top results
export const topResults = async (req, res) => {

  if (!isDataLoaded) {
    return res.status(500).json({
      message: "500 error  .",
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

  //create tf_idf of query
  var tf_idf_query = [];
  for (var i = 0; i < idf_values.length; i++) {
    tf_idf_query.push(tf_query[i] * idf_values[i]);
    if (tf_query[i] * idf_values[i]) {
      console.log(tf_query[i] * idf_values[i]);
    }
  }

  var tf_idf_doc = [];
  for (var i = 0; i < tot_doc; i++) {
    var values = [];
    for (var j = 0; j < all_keyword.length; j++) {
      let tf_idf_value = tf_idf_matrix[i] ? tf_idf_matrix[i][j] : undefined; 
      if (tf_idf_value === undefined || isNaN(tf_idf_value)) {
        values.push(0); 
      } else {
        values.push(tf_idf_value); 
      }
    }
    tf_idf_doc.push(values);
  }


  //calculate the magnitude of query vector
  var mag_query = 0;
  for (var i = 0; i < idf_values.length; i++) {
    if (tf_idf_query[i] > 0) {
      mag_query += tf_idf_query[i] * tf_idf_query[i];
    }
  }
  mag_query = Math.sqrt(mag_query);


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

  // Sort by similarity score (not by key), in descending order
  var selectivity_order = new Map(
    [...selectivity_values.entries()].sort((a, b) => b[0] - a[0]) // Sort numerically by similarity score
  );

  // Collect the document IDs (problem_ids) from the sorted map
  var doc_order = [];
  selectivity_order.forEach((key, value) => {
    doc_order.push(key); 
  });

  var data = [];
  for (var i = 0; i < Math.min(5, doc_order.length); i++) {
    let queryDocId = (doc_order[i]);
    let dbData = await all_problem.find({ problem_id: queryDocId });
    if (dbData && dbData.length > 0) {
      data.push(dbData[0]);
    } else {
      console.log(`No data found for doc_id ${queryDocId}`);
    }
  }
  // Send the response
  res.json({ data });
};
