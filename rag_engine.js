/* Maple & Thread help desk: retrieval-augmented assistant over a synthetic knowledge base.
   Retrieval: BM25 over passages. Tools: order lookup and shipping quote.
   All data below is synthetic (a fictional craft-kit store). */
(function (root) {
  const DOCS = [
    // ---- products
    { id: "kit-macrame", title: "Macrame Wall Hanging Kit", type: "product", text: "The Macrame Wall Hanging Kit costs $42 and is rated beginner. It includes 60 meters of 4 mm cotton cord, a 30 cm wooden dowel and a printed pattern. Most people finish it in about 3 hours. The finished piece is 30 cm wide and 75 cm long." },
    { id: "kit-candle", title: "Soy Candle Making Kit", type: "product", text: "The Soy Candle Making Kit costs $38 and is rated beginner. It makes four 8 oz candles and includes 2 lb of soy wax, four cotton wicks, three fragrance oils (lavender, cedar, citrus) and a pouring pitcher. Allow 24 hours for candles to cure before burning." },
    { id: "kit-embroidery", title: "Botanical Embroidery Kit", type: "product", text: "The Botanical Embroidery Kit costs $29 and is rated beginner. It includes a 15 cm bamboo hoop, pre-printed linen fabric, 12 colors of DMC floss and two needles. Video lessons cover the 6 stitches used in the pattern. It takes about 5 hours." },
    { id: "kit-pottery", title: "Air-Dry Clay Pottery Kit", type: "product", text: "The Air-Dry Clay Pottery Kit costs $34 and is rated beginner. It includes 1 kg of white air-dry clay, 5 sculpting tools, acrylic paints and a sealant. No kiln is needed. Pieces dry in 48 to 72 hours. The clay is not food safe, so finished pieces are decorative only." },
    { id: "kit-watercolor", title: "Watercolor Landscapes Kit", type: "product", text: "The Watercolor Landscapes Kit costs $45 and is rated intermediate. It includes 12 artist-grade pans, two round brushes (size 4 and 8), a pad of 300 gsm cold-press paper and 4 step-by-step landscape lessons." },
    { id: "kit-knit", title: "Chunky Knit Blanket Kit", type: "product", text: "The Chunky Knit Blanket Kit costs $89 and is rated beginner. It includes 4 kg of merino chunky yarn and makes a 100 by 125 cm throw. It is knitted by hand with no needles. Most people finish it in one afternoon, about 4 hours. Merino is not suitable for anyone with a wool allergy." },
    { id: "kit-resin", title: "Resin Coaster Kit", type: "product", text: "The Resin Coaster Kit costs $52 and is rated intermediate. It makes six coasters and includes 500 ml of two-part epoxy resin, a silicone mold, mica powders, gloves and mixing cups. Resin needs 24 hours to set and 72 hours to fully cure. Work in a ventilated room. Not recommended for children under 16." },
    { id: "kit-leather", title: "Leather Card Wallet Kit", type: "product", text: "The Leather Card Wallet Kit costs $48 and is rated intermediate. It includes pre-cut vegetable-tanned leather, waxed thread, two needles, a stitching awl and edge finishing balm. It takes about 2 hours." },
    { id: "kit-kids", title: "Kids Felt Animals Kit", type: "product", text: "The Kids Felt Animals Kit costs $24 and is designed for ages 7 and up. It makes five felt animals and uses blunt plastic needles and pre-punched felt, so no sharp tools are included. Adult supervision is recommended for children under 7." },
    { id: "kit-bundle", title: "Beginner Bundle", type: "product", text: "The Beginner Bundle costs $95 and includes the Macrame Wall Hanging Kit, the Botanical Embroidery Kit and the Soy Candle Making Kit. Bought separately these cost $109, so the bundle saves $14." },
    // ---- policies
    { id: "pol-shipping", title: "Shipping policy", type: "policy", text: "Standard shipping in the US takes 3 to 5 business days and costs $6.95. Orders over $75 ship free with standard shipping. Express shipping takes 1 to 2 business days and costs $14.95. Orders placed before 1 pm Pacific ship the same day." },
    { id: "pol-intl", title: "International shipping", type: "policy", text: "We ship to Canada, the United Kingdom and Australia. International shipping costs $19.95 and takes 7 to 14 business days. Customers pay any import duties or taxes charged by their country. We do not currently ship to other countries." },
    { id: "pol-returns", title: "Returns policy", type: "policy", text: "Unopened kits can be returned within 30 days of delivery for a full refund. Opened kits can be returned within 30 days for store credit if most materials are unused. Return shipping is free if the item arrived damaged or wrong; otherwise a $6.95 return label fee is deducted." },
    { id: "pol-damaged", title: "Damaged or missing items", type: "policy", text: "If a kit arrives damaged or a part is missing, email a photo within 14 days of delivery. We send replacement parts at no cost, usually within 2 business days. You do not need to return the damaged item." },
    { id: "pol-giftcard", title: "Gift cards", type: "policy", text: "Digital gift cards are available from $25 to $250 and are delivered by email within minutes. Gift cards never expire and can be combined with one discount code. Gift cards cannot be exchanged for cash." },
    { id: "pol-discount", title: "Discount codes", type: "policy", text: "Only one discount code can be used per order. First-time customers get 10% off with code WELCOME10. Discount codes cannot be applied to gift card purchases or to orders that were already placed." },
    { id: "pol-workshops", title: "Live workshops", type: "policy", text: "Live online workshops run every Saturday at 10 am Pacific and last 90 minutes. Tickets cost $15, or are free with any kit purchase in the previous 30 days. Recordings are available for 7 days after the session." },
    { id: "pol-wholesale", title: "Wholesale and classroom orders", type: "policy", text: "Schools, libraries and businesses can order 20 or more kits at a 25% wholesale discount. Wholesale orders ship in 5 to 7 business days and can be paid by invoice with net 30 terms." },
    { id: "pol-cancel", title: "Changing or cancelling an order", type: "policy", text: "Orders can be changed or cancelled within 1 hour of being placed. After that the order enters packing and cannot be changed, but it can be returned under the returns policy." },
    { id: "pol-contact", title: "Contact and hours", type: "policy", text: "Customer support is available by email at help@maplethread.example, Monday to Friday, 8 am to 5 pm Pacific. We reply within one business day." },
    { id: "pol-sustain", title: "Sustainability", type: "policy", text: "Kits ship in recycled cardboard with paper tape and no plastic fillers. Cotton cord and linen are sourced from certified organic suppliers. Empty candle tins can be returned for a $2 credit." },
    { id: "pol-allergy", title: "Allergies and safety", type: "policy", text: "Fragrance oils in the candle kit are phthalate free. The chunky knit kit uses merino wool. The resin kit requires gloves and ventilation. Safety data sheets are available on request." },
    { id: "pol-loyalty", title: "Loyalty points", type: "policy", text: "Members earn 1 point per dollar spent. 100 points can be redeemed for $5 off a future order. Points expire 12 months after they are earned." },
  ];

  // Synthetic orders for the order-status tool
  const ORDERS = {
    "MT-1001": { status: "Delivered", date: "Oct 2", items: "Soy Candle Making Kit" },
    "MT-1002": { status: "Shipped", date: "Oct 24", items: "Chunky Knit Blanket Kit", tracking: "1Z999AA10123456784" },
    "MT-1003": { status: "Packing", date: "Oct 27", items: "Resin Coaster Kit, Leather Card Wallet Kit" },
    "MT-1004": { status: "Cancelled", date: "Oct 20", items: "Watercolor Landscapes Kit" },
    "MT-1005": { status: "Shipped", date: "Oct 26", items: "Beginner Bundle", tracking: "1Z999AA10123459912" },
  };

  // ---------------- BM25 retrieval
  const STOP = new Set("a an and are as at be by can do does for from how i if in is it its my of on or the to what when which who will with you your there this that me we our much many long".split(" "));
  const tok = s => (s.toLowerCase().match(/[a-z0-9]+/g) || []).map(w => w.replace(/(ies)$/, "y").replace(/(?<=[a-z]{3})s$/, "")).filter(w => !STOP.has(w));
  const passages = DOCS.map(d => ({ ...d, toks: tok(d.title + " " + d.title + " " + d.text) }));
  const N = passages.length, avgdl = passages.reduce((a, p) => a + p.toks.length, 0) / N;
  const df = {};
  passages.forEach(p => new Set(p.toks).forEach(t => (df[t] = (df[t] || 0) + 1)));
  const MIN_SCORE = 2.4;
  function search(q, k = 3) {
    const qt = tok(q), k1 = 1.4, b = 0.75;
    return passages.map(p => {
      let s = 0;
      qt.forEach(t => {
        if (!df[t]) return;
        const f = p.toks.filter(x => x === t).length; if (!f) return;
        const idf = Math.log(1 + (N - df[t] + .5) / (df[t] + .5));
        s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * p.toks.length / avgdl));
      });
      return { doc: p, score: s };
    }).sort((x, y) => y.score - x.score).slice(0, k);
  }
  function bestSentences(q, doc, n = 2) {
    const titleT = new Set(tok(doc.title));
    const qt = new Set(tok(q).filter(t => !titleT.has(t)));
    const sents = doc.text.split(/(?<=[.!?])\s+(?=[A-Z])/);
    return sents.map((s, i) => ({ s: s.trim(), i, sc: tok(s).filter(t => qt.has(t)).length + (i === 0 ? .2 : 0) }))
      .sort((a, b) => b.sc - a.sc || a.i - b.i).slice(0, n).sort((a, b) => a.i - b.i).map(x => x.s).join(" ");
  }

  // ---------------- tools
  function toolOrder(q) {
    const m = q.toUpperCase().match(/MT-?\s?(\d{4})/); if (!m) return null;
    const id = "MT-" + m[1], o = ORDERS[id];
    if (!o) return { tool: "order_lookup", input: id, answer: `I couldn't find order ${id}. Please check the number on your confirmation email.` };
    let a = `Order ${id} (${o.items}) is ${o.status.toLowerCase()} as of ${o.date}.`;
    if (o.tracking) a += ` Tracking number: ${o.tracking}.`;
    if (o.status === "Packing") a += " It is past the 1-hour change window, so it can no longer be changed.";
    return { tool: "order_lookup", input: id, answer: a };
  }
  function toolShipping(q) {
    if (!/(ship|deliver)/i.test(q)) return null;
    const m = q.match(/\$\s?(\d+(?:\.\d+)?)/); if (!m) return null;
    const total = parseFloat(m[1]), express = /express|fast|overnight|1-2/i.test(q);
    const intl = /(canada|uk|united kingdom|australia)/i.test(q);
    let cost, note;
    if (intl) { cost = 19.95; note = "international shipping, 7 to 14 business days"; }
    else if (express) { cost = 14.95; note = "express, 1 to 2 business days"; }
    else if (total > 75) { cost = 0; note = "free standard shipping on orders over $75"; }
    else { cost = 6.95; note = "standard, 3 to 5 business days"; }
    return { tool: "shipping_quote", input: `$${total}${express ? ", express" : ""}${intl ? ", international" : ""}`,
      answer: `Shipping for a $${total.toFixed(2)} order: ${cost === 0 ? "free" : "$" + cost.toFixed(2)} (${note}). Order total $${(total + cost).toFixed(2)}.` };
  }

  function answer(q) {
    const trace = [];
    for (const t of [toolOrder, toolShipping]) {
      const r = t(q);
      if (r) { trace.push(`Tool call: ${r.tool}(${r.input})`); return { answer: r.answer, sources: r.tool === "shipping_quote" ? ["pol-shipping"] : [], trace, tool: r.tool }; }
    }
    const hits = search(q, 3);
    trace.push("Retrieved: " + hits.map(h => `${h.doc.id} (${h.score.toFixed(2)})`).join(", "));
    if (!hits.length || hits[0].score < MIN_SCORE) {
      trace.push("Top score below threshold, so the assistant declines instead of guessing");
      return { answer: "I don't have that in the help center. Please email help@maplethread.example and the team will reply within one business day.", sources: [], trace, declined: true };
    }
    const top = hits[0].doc;
    return { answer: bestSentences(q, top), sources: [top.id], titles: [top.title], trace };
  }
  root.MapleRAG = { DOCS, ORDERS, search, answer, tok };
  if (typeof module !== "undefined") module.exports = root.MapleRAG;
})(typeof window !== "undefined" ? window : globalThis);
