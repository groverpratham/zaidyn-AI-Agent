// Candidates checked, in order of how often they show up in flat files.
const CANDIDATE_DELIMITERS = ["\t", ",", "|", ";"];

/**
 * Given a raw text sample (just the first chunk of the file), work out
 * which delimiter it uses and what the columns look like.
 *
 * Strategy: for each candidate delimiter, split every sample line and see
 * how many fields come out. A real delimiter gives a consistent field
 * count across lines (low variance) and more than one field. Whichever
 * candidate wins that test is the file's delimiter.
 */
export function detectDelimiterAndSchema(sampleText, skipHeader = true) {
  const lines = sampleText
    .split(/\r\n|\n|\r/)
    .filter((line) => line.length > 0)
    .slice(0, 25); // 25 lines is plenty to be confident

  if (lines.length === 0) {
    throw new Error("The file looks empty, so there's nothing to detect.");
  }

  let best = { delimiter: ",", score: -1 };

  for (const delimiter of CANDIDATE_DELIMITERS) {
    const counts = lines.map((line) => line.split(delimiter).length);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance =
      counts.reduce((sum, c) => sum + (c - avg) ** 2, 0) / counts.length;

    // Only worth considering if it actually splits into multiple fields.
    const score = avg > 1 ? avg / (1 + variance) : -1;

    if (score > best.score) {
      best = { delimiter, score };
    }
  }

  const headerCells = lines[0].split(best.delimiter);
  const dataLines = skipHeader ? lines.slice(1) : lines;
  const sampleRows = dataLines.map((line) => line.split(best.delimiter));

  const dataSetSchema = headerCells.map((rawName, colIndex) => {
    const columnName =
      rawName.trim().replace(/^"|"$/g, "") || `column_${colIndex + 1}`;
    const columnValues = sampleRows.map((row) => (row[colIndex] || "").trim());

    return {
      key: "false",
      width: "",
      ColumnName: columnName,
      ColumnType: inferColumnType(columnValues),
      Expression: "",
      source_format: "",
    };
  });

  return { delimiter: best.delimiter, dataSetSchema };
}

function inferColumnType(values) {
  const nonEmpty = values.filter((v) => v !== "");
  if (nonEmpty.length === 0) return "string";

  if (nonEmpty.every((v) => /^-?\d+$/.test(v))) return "integer";
  if (nonEmpty.every((v) => /^-?\d+\.\d+$/.test(v))) return "decimal";
  if (
    nonEmpty.every(
      (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) || /^\d{2}\/\d{2}\/\d{4}$/.test(v)
    )
  )
    return "date";

  return "string";
}
