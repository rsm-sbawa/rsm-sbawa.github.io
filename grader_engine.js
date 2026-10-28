/* SQL assignment-checking agent. Works in the browser and in Node.
   The agent plans a fixed set of steps and uses tools: a safety check, a SQLite engine
   (sql.js), a result comparer and a diagnosis step that writes feedback.
   The database and every submission used for testing are synthetic. */
(function (root) {
  // ---------------- synthetic database (seeded, so it is identical everywhere)
  function rng(seed) { return () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296; }
  function buildSQL() {
    const r = rng(42);
    const cities = ["San Diego", "Chicago", "New York", "Austin", "Seattle"];
    const products = [["Macrame Kit", "Fiber", 42], ["Candle Kit", "Home", 38], ["Embroidery Kit", "Fiber", 29],
      ["Pottery Kit", "Clay", 34], ["Resin Kit", "Home", 52], ["Knit Blanket Kit", "Fiber", 89], ["Leather Wallet Kit", "Leather", 48]];
    let s = `CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT, signup_date TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, order_date TEXT, total REAL);
CREATE TABLE order_items (order_id INTEGER, product TEXT, category TEXT, qty INTEGER, price REAL);\n`;
    const first = ["Ava", "Liam", "Mia", "Noah", "Zoe", "Ethan", "Ivy", "Owen", "Leah", "Ravi", "Sana", "Theo", "Nina", "Arjun", "Elle", "Kai", "Maya", "Jon", "Priya", "Luca"];
    first.forEach((n, i) => { s += `INSERT INTO customers VALUES (${i + 1}, '${n}', '${cities[i % 5]}', '2024-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + i).padStart(2, "0")}');\n`; });
    let oid = 1;
    for (let c = 1; c <= 20; c++) {
      if ([4, 9, 15, 18].includes(c)) continue;            // four customers never order
      const n = 1 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) {
        const m = 1 + Math.floor(r() * 12), d = 1 + Math.floor(r() * 28);
        const items = 1 + Math.floor(r() * 3); let tot = 0, rows = "";
        const used = new Set();
        for (let j = 0; j < items; j++) {
          let p; do { p = products[Math.floor(r() * products.length)]; } while (used.has(p[0])); used.add(p[0]);
          const q = 1 + Math.floor(r() * 3); tot += q * p[2];
          rows += `INSERT INTO order_items VALUES (${oid}, '${p[0]}', '${p[1]}', ${q}, ${p[2]});\n`;
        }
        s += `INSERT INTO orders VALUES (${oid}, ${c}, '2025-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}', ${tot});\n` + rows;
        oid++;
      }
    }
    return s;
  }

  const QUESTIONS = [
    { id: "Q1", title: "Total revenue by city, highest first", ordered: true,
      prompt: "Return each customer city and its total order revenue, sorted from highest to lowest revenue.",
      ref: "SELECT c.city, ROUND(SUM(o.total),2) AS revenue FROM customers c JOIN orders o ON o.customer_id=c.id GROUP BY c.city ORDER BY revenue DESC" },
    { id: "Q2", title: "Customers who never ordered", ordered: false,
      prompt: "Return the name of every customer who has never placed an order.",
      ref: "SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders)" },
    { id: "Q3", title: "Orders per customer, including zero", ordered: false,
      prompt: "Return every customer's name and their number of orders. Customers with no orders must show 0.",
      ref: "SELECT c.name, COUNT(o.id) AS n_orders FROM customers c LEFT JOIN orders o ON o.customer_id=c.id GROUP BY c.id, c.name" },
    { id: "Q4", title: "Top 3 products by units sold", ordered: true,
      prompt: "Return the 3 products with the most units sold and their unit totals, highest first.",
      ref: "SELECT product, SUM(qty) AS units FROM order_items GROUP BY product ORDER BY units DESC, product LIMIT 3" },
    { id: "Q5", title: "Average order value by quarter", ordered: true,
      prompt: "Return each quarter of 2025 (1 to 4) and its average order total rounded to 2 decimals, in quarter order.",
      ref: "SELECT (CAST(strftime('%m', order_date) AS INTEGER)+2)/3 AS quarter, ROUND(AVG(total),2) AS avg_order FROM orders GROUP BY quarter ORDER BY quarter" },
  ];

  // ---------------- tools
  function safetyCheck(sql) {
    const s = sql.trim().replace(/;\s*$/, "");
    if (!s) return "The submission is empty.";
    if (s.includes(";")) return "Submit a single query (found more than one statement).";
    if (!/^(select|with)\b/i.test(s)) return "Only SELECT queries can be graded.";
    if (/\b(drop|delete|update|insert|alter|attach|pragma|create|replace)\b/i.test(s)) return "The query contains a statement that changes the database, so it was not run.";
    return null;
  }
  function run(db, sql) {
    const res = db.exec(sql.trim().replace(/;\s*$/, ""));
    if (!res.length) return { columns: [], rows: [] };
    return { columns: res[0].columns, rows: res[0].values };
  }
  const norm = v => (typeof v === "number" ? Math.round(v * 100) / 100 : v === null ? null : String(v).trim());
  function compare(ref, stu, ordered) {
    if (stu.columns.length !== ref.columns.length)
      return { ok: false, why: "columns", detail: `Expected ${ref.columns.length} column(s), got ${stu.columns.length}.` };
    // match each reference column to a student column with the same values (allows reordered columns)
    const key = (rows, j) => JSON.stringify(rows.map(r => norm(r[j])).sort());
    const used = new Set(), map = [];
    for (let j = 0; j < ref.columns.length; j++) {
      const k = key(ref.rows, j);
      const m = stu.columns.findIndex((_, i) => !used.has(i) && key(stu.rows, i) === k);
      map.push(m === -1 ? j : m); if (m !== -1) used.add(m);
    }
    const proj = rows => rows.map(r => JSON.stringify(map.map(i => norm(r[i]))));
    const R = ref.rows.map(r => JSON.stringify(r.map(norm))), S = proj(stu.rows);
    if (R.length !== S.length) return { ok: false, why: "rowcount", detail: `Expected ${R.length} row(s), got ${S.length}.`, R, S };
    const same = [...R].sort().join("|") === [...S].sort().join("|");
    if (!same) return { ok: false, why: "values", detail: "Same number of rows, but some values differ.", R, S };
    if (ordered && R.join("|") !== S.join("|")) return { ok: false, why: "order", detail: "Right rows, wrong order." };
    return { ok: true };
  }
  function diagnose(q, cmp, sql) {
    const s = sql.toLowerCase(), tips = [];
    if (cmp.why === "rowcount" && cmp.S.length < cmp.R.length && /\bjoin\b/.test(s) && !/left\s+join/.test(s) && q.id === "Q3")
      tips.push("Customers with no orders are missing. An inner JOIN drops them; a LEFT JOIN keeps them.");
    if (cmp.why === "values" && q.id === "Q3" && /count\(\s*\*\s*\)/.test(s))
      tips.push("COUNT(*) counts the empty joined row as 1. Count a column from the orders table instead, e.g. COUNT(o.id).");
    if (cmp.why === "order") tips.push(q.ordered ? "Check the ORDER BY direction (highest first needs DESC)." : "");
    if (cmp.why === "rowcount" && q.id === "Q4" && !/limit\s+3/.test(s)) tips.push("The question asks for the top 3 only. Add LIMIT 3.");
    if (cmp.why === "values" && /\bavg\b/.test(s) && !/round/.test(s)) tips.push("Values differ slightly; the question asks for rounding to 2 decimals.");
    if (cmp.why === "values" && q.id === "Q4" && /count\(/.test(s)) tips.push("Units sold means summing qty, not counting rows.");
    if (cmp.why === "rowcount" && q.id === "Q2" && /\bjoin\b/.test(s)) tips.push("Joining to orders keeps only customers who did order. Look for customers with no matching order (NOT IN, NOT EXISTS or LEFT JOIN ... IS NULL).");
    if (cmp.why === "columns") tips.push("Return exactly the columns the question asks for.");
    if (!tips.filter(Boolean).length) tips.push("Compare your output with what the question asks for, row by row.");
    return tips.filter(Boolean);
  }

  // ---------------- the agent
  function grade(db, qid, sql) {
    const q = QUESTIONS.find(x => x.id === qid), steps = [];
    steps.push(`Plan: safety check, run submission, run reference, compare results, write feedback.`);
    const unsafe = safetyCheck(sql);
    if (unsafe) { steps.push("Safety check: failed. " + unsafe); return { correct: false, score: 0, feedback: [unsafe], steps }; }
    steps.push("Safety check: passed (single read-only query).");
    let stu;
    try { stu = run(db, sql); steps.push(`Ran submission: ${stu.rows.length} row(s), columns [${stu.columns.join(", ")}].`); }
    catch (e) { steps.push("Ran submission: SQL error."); return { correct: false, score: 0, feedback: ["The query did not run: " + e.message], steps }; }
    const ref = run(db, q.ref); steps.push(`Ran reference solution: ${ref.rows.length} row(s).`);
    const cmp = compare(ref, stu, q.ordered);
    if (cmp.ok) { steps.push("Compared results: match."); return { correct: true, score: 10, feedback: ["Correct. Your result matches the expected output."], steps, preview: stu }; }
    steps.push("Compared results: " + cmp.detail);
    const tips = diagnose(q, cmp, sql); steps.push("Diagnosis: " + tips.length + " hint(s) written.");
    const score = cmp.why === "order" ? 8 : cmp.why === "values" ? 5 : cmp.why === "rowcount" ? 4 : 2;
    return { correct: false, score, feedback: [cmp.detail, ...tips], steps, preview: stu };
  }

  root.SQLGrader = { buildSQL, QUESTIONS, grade, safetyCheck };
  if (typeof module !== "undefined") module.exports = root.SQLGrader;
})(typeof window !== "undefined" ? window : globalThis);
