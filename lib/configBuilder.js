// Turns "filePath" + "fileName" into the S3 object key we actually fetch.
// S3 keys never start with a slash, even if the user types one.
export function toS3Key(filePath, fileName) {
  const cleanPath = filePath.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  const cleanName = fileName.trim().replace(/^\/+/, "");
  return cleanPath ? `${cleanPath}/${cleanName}` : cleanName;
}

// The "Source" field in the output JSON mirrors how the platform already
// stores paths elsewhere: leading slash, no trailing slash.
function toSourcePath(filePath, fileName) {
  let p = filePath.trim();
  if (!p.startsWith("/")) p = "/" + p;
  p = p.replace(/\/+$/, "");
  return `${p}/${fileName.trim()}`;
}

// The platform stores a tab as the two literal characters "\t" rather
// than an actual tab byte — this keeps that convention.
function toDisplayDelimiter(delimiter) {
  if (delimiter === "\t") return "\\t";
  return delimiter;
}

export function buildIngestionConfig({ filePath, fileName, delimiter, dataSetSchema }) {
  const baseName = fileName.trim().replace(/\.[^/.]+$/, "");

  return {
    name: baseName,
    data: {
      Table: "select",
      query: null,
      Fields: [],
      Format: "textfile",
      object: "",
      Columns: [],
      ClientId: "stcl_dev",
      Expected: [
        {
          Source: toSourcePath(filePath, fileName),
          adaptorType: "",
          archivalPath: "",
        },
      ],
      autoSync: "false",
      fileType: "delimiter",
      Delimiter: toDisplayDelimiter(delimiter),
      IsShuffle: false,
      JobsToRun: ["DATA_TRANSFER", "DATA_INGESTION"],
      ProjectId: "Stencil_Store_Dev",
      TableName: baseName,
      sortField: "",
      sortOrder: "",
      SkipHeader: "true",
      AdaptorName: "AGENT_S3",
      AdaptorType: "S3",
      DfParameters: [],
      FileLoadType: "full",
      SparkSetting: "",
      nativeSchema: "false",
      DataSetSchema: dataSetSchema,
      IsCustomQuery: "false",
      nullCharactor: "",
      quoteCharacter: "",
      SkipRecordCount: "1",
      TransactionType: "dimensional",
      escapeCharacter: "",
      FileSheetMapping: [],
      customExtensions: [],
      filterConditions: [],
      NumberOfPartitions: null,
      IncludeAuditColumns: "true",
      IncludeDeletedRecords: "false",
      columnsForPartitioning: [],
      includeCustomExtension: false,
    },
  };
}
