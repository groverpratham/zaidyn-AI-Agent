import { useState } from "react";

export default function Home() {
  const [filePath, setFilePath] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sendStatus, setSendStatus] = useState("");

  async function handleRun(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setSendStatus("");

    if (!filePath.trim() || !fileName.trim()) {
      setError("Fill in both File Path and File Name before running.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, fileName }),
      });
      const body = await res.json();
      if (!body.success) {
        setError(body.message || "Something went wrong reading that file.");
      } else {
        setResult(body.data);
      }
    } catch (err) {
      setError(err.message || "Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSend() {
    if (!result) return;
    setSendStatus("sending");
    try {
      const res = await fetch("/api/forward-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: result }),
      });
      const body = await res.json();
      setSendStatus(body.success ? "sent" : "not-configured");
    } catch {
      setSendStatus("error");
    }
  }

  const jsonLines = result ? JSON.stringify(result, null, 2).split("\n") : [];

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <Logo />
          <div className="brandtext">
            <span className="brandname">ZAIDYN</span>
            <span className="brandsub">BY ZS</span>
          </div>
        </div>
        <span className="tag">S3 Ingestion Config Generator</span>
      </header>

      <main className="main">
        <section className="card">
          <h1>Generate an ingestion config</h1>
          <p className="subtitle">
            Point this at a file already sitting in S3. It reads the header row,
            works out the delimiter and column types, and builds the config
            below — the same thing you'd otherwise piece together by hand.
          </p>

          <form onSubmit={handleRun} className="form">
            <label>
              <span>File Path</span>
              <input
                type="text"
                placeholder="/SFO/Roster_Production/ZFD/Control_Tables"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                disabled={loading}
              />
            </label>

            <label>
              <span>File Name</span>
              <input
                type="text"
                placeholder="ZFD_CTL_MARKETING.txt"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                disabled={loading}
              />
            </label>

            <button type="submit" className="runbtn" disabled={loading}>
              {loading ? <Spinner /> : "Run"}
            </button>
          </form>

          {error && <div className="error">{error}</div>}
        </section>

        {result && (
          <section className="card resultcard">
            <div className="resultheader">
              <div>
                <h2>Generated config</h2>
                <p className="resultmeta">
                  Response · {jsonLines.length} lines
                </p>
              </div>
              <div className="actions">
                <button onClick={handleCopy} className="ghostbtn">
                  {copied ? "Copied" : "Copy JSON"}
                </button>
                <button onClick={handleSend} className="ghostbtn primary">
                  Send to Pipeline
                </button>
              </div>
            </div>

            <div className="jsonpanel">
              <pre>
                {jsonLines.map((line, i) => (
                  <div className="jsonrow" key={i}>
                    <span className="lineno">{i + 1}</span>
                    <span className="linetext">{line}</span>
                  </div>
                ))}
              </pre>
            </div>

            {sendStatus === "not-configured" && (
              <p className="hint">
                Downstream API isn't wired up yet — set DOWNSTREAM_API_URL once
                you have the endpoint.
              </p>
            )}
            {sendStatus === "sent" && <p className="hint success">Sent.</p>}
            {sendStatus === "error" && (
              <p className="hint danger">Failed to send — check the server logs.</p>
            )}
          </section>
        )}
      </main>

      <footer className="footer">ZAIDYN BY ZS — Internal Tooling</footer>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 40px;
          background: #1b1e26;
          border-bottom: 3px solid #e8732c;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brandtext {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .brandname {
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.5px;
        }

        .brandsub {
          font-size: 11px;
          font-weight: 600;
          color: #9aa0aa;
          letter-spacing: 1.5px;
        }

        .tag {
          font-size: 13px;
          color: #c7ccd4;
          background: rgba(255, 255, 255, 0.06);
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .main {
          flex: 1;
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
          padding: 48px 24px 64px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .card {
          background: #ffffff;
          border-radius: 14px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(20, 22, 30, 0.06), 0 10px 30px rgba(20, 22, 30, 0.05);
        }

        h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1f2229;
        }

        .subtitle {
          margin-top: 8px;
          color: #6b7280;
          font-size: 14.5px;
          line-height: 1.55;
          max-width: 560px;
        }

        .form {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #40444d;
        }

        input {
          padding: 12px 14px;
          font-size: 14.5px;
          border: 1px solid #d8dbe0;
          border-radius: 8px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          color: #1f2229;
        }

        input::placeholder {
          color: #a8adb5;
        }

        input:focus {
          border-color: #e8732c;
          box-shadow: 0 0 0 3px rgba(232, 115, 44, 0.15);
        }

        input:disabled {
          background: #f5f6f8;
          color: #9aa0aa;
        }

        .runbtn {
          margin-top: 4px;
          align-self: flex-start;
          background: #12909a;
          color: #ffffff;
          border: none;
          font-weight: 700;
          font-size: 14.5px;
          padding: 12px 32px;
          border-radius: 8px;
          min-width: 110px;
          transition: background 0.15s, transform 0.1s;
        }

        .runbtn:hover:not(:disabled) {
          background: #0f7a83;
        }

        .runbtn:disabled {
          opacity: 0.75;
          cursor: default;
        }

        .error {
          margin-top: 18px;
          background: #fdecea;
          border: 1px solid #f3c2bd;
          color: #a13a30;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13.5px;
        }

        .resultcard {
          padding: 0;
          overflow: hidden;
        }

        .resultheader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px 18px;
        }

        .resultheader h2 {
          font-size: 17px;
          font-weight: 700;
          color: #1f2229;
        }

        .resultmeta {
          margin-top: 3px;
          font-size: 12px;
          color: #9aa0aa;
          font-family: "SFMono-Regular", Consolas, monospace;
        }

        .actions {
          display: flex;
          gap: 10px;
        }

        .ghostbtn {
          background: #f5f6f8;
          border: 1px solid #e1e4e9;
          color: #40444d;
          font-size: 13px;
          font-weight: 600;
          padding: 9px 16px;
          border-radius: 7px;
        }

        .ghostbtn:hover {
          background: #ebeef1;
        }

        .ghostbtn.primary {
          background: #e8732c;
          border-color: #e8732c;
          color: #ffffff;
        }

        .ghostbtn.primary:hover {
          background: #d6631f;
        }

        .jsonpanel {
          background: #12141c;
          padding: 18px 0;
          max-height: 420px;
          overflow: auto;
        }

        .jsonpanel pre {
          margin: 0;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 13px;
          line-height: 1.65;
        }

        .jsonrow {
          display: flex;
          padding: 0 20px;
        }

        .jsonrow:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .lineno {
          width: 32px;
          flex-shrink: 0;
          color: #4a5060;
          text-align: right;
          margin-right: 16px;
          user-select: none;
        }

        .linetext {
          color: #d8e0e8;
          white-space: pre;
        }

        .hint {
          font-size: 12.5px;
          color: #9aa0aa;
          padding: 4px 28px 18px;
        }

        .hint.success {
          color: #1a9c6f;
        }

        .hint.danger {
          color: #d1453b;
        }

        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #a8adb5;
        }

        @media (max-width: 560px) {
          .topbar {
            padding: 16px 20px;
          }
          .card {
            padding: 22px;
          }
        }
      `}</style>
    </div>
  );
}

function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="34" height="20" rx="10" stroke="#e8732c" strokeWidth="5" />
      <rect x="24" y="26" width="34" height="20" rx="10" stroke="#a9aeb4" strokeWidth="5" />
    </svg>
  );
}

function Spinner() {
  return (
    <span className="spinner">
      <style jsx>{`
        .spinner {
          display: inline-block;
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </span>
  );
}
