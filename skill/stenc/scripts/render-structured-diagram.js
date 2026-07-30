"use strict";

function roleClass(role, escapeHtml) {
  return `diagram-role-${escapeHtml(role)}`;
}

function renderFigureHeading(block, kindLabel, escapeHtml, ids) {
  return `<figcaption id="${ids.caption}"><span class="badge">${kindLabel}</span> <strong>${escapeHtml(block.title)}</strong></figcaption>
<p id="${ids.summary}" class="diagram-summary">${escapeHtml(block.summary)}</p>`;
}

function renderLayerNode(node, escapeHtml) {
  return `<article class="diagram-node-card" data-node-id="${escapeHtml(node.id)}"><strong class="diagram-node-label">${escapeHtml(node.label)}</strong><p class="diagram-node-detail">${escapeHtml(node.detail)}</p></article>`;
}

function renderLayerFallback(block, escapeHtml, fallbackId) {
  const layers = block.layers.map((layer) => {
    const nodes = layer.nodes
      .map(
        (node) =>
          `<li data-node-id="${escapeHtml(node.id)}"><strong>${escapeHtml(node.label)}</strong> <code>(${escapeHtml(node.id)})</code>: <span>${escapeHtml(node.detail)}</span></li>`,
      )
      .join("\n");
    const transition = layer.transition
      ? `<p class="diagram-fallback-transition"><strong>Transition:</strong> ${escapeHtml(layer.transition)}</p>`
      : "";
    return `<li data-layer-id="${escapeHtml(layer.id)}"><strong>${escapeHtml(layer.label)}</strong> <code>(${escapeHtml(layer.id)})</code> <span class="diagram-role-label">— Role: ${escapeHtml(layer.role)}.</span> <p>${escapeHtml(layer.summary)}</p>
<ol class="diagram-fallback-node-list">${nodes}</ol>
${transition}</li>`;
  }).join("\n");

  return `<ol id="${fallbackId}" class="diagram-fallback diagram-layer-fallback visually-hidden">${layers}</ol>`;
}

function renderHeadingOrLabel(text, level, className, escapeHtml) {
  const escapedText = escapeHtml(text);
  if (level <= 6) {
    return `<h${level} class="${className}">${escapedText}</h${level}>`;
  }
  return `<p class="${className} semantic-label"><strong>${escapedText}</strong></p>`;
}

function renderLayerDiagram(block, escapeHtml, headingLevel, ids) {
  const layers = block.layers.map((layer, index) => {
    const nodes = layer.nodes.map((node) => renderLayerNode(node, escapeHtml)).join("");
    const transition = layer.transition
      ? `<div class="diagram-layer-transition" data-from="${escapeHtml(layer.id)}" data-to="${escapeHtml(block.layers[index + 1].id)}"><span class="diagram-directed-label">${escapeHtml(layer.transition)}</span></div>`
      : "";
    return `<section class="diagram-layer ${roleClass(layer.role, escapeHtml)}" data-layer-id="${escapeHtml(layer.id)}"><div class="diagram-role-rail"><span class="diagram-role-label">${escapeHtml(layer.role)}</span></div><div class="diagram-layer-content">${renderHeadingOrLabel(layer.label, headingLevel, "diagram-layer-title", escapeHtml)}<p>${escapeHtml(layer.summary)}</p><div class="diagram-layer-nodes">${nodes}</div></div></section>${transition}`;
  }).join("");

  return `<figure class="rich-block rich-structured-diagram layer-diagram" aria-labelledby="${ids.caption}" aria-describedby="${ids.summary}" aria-details="${ids.fallback}">${renderFigureHeading(block, "Layer diagram", escapeHtml, ids)}<div class="diagram-visual diagram-layer-stack" aria-hidden="true"><div class="diagram-mobile-linear">${layers}</div></div>${renderLayerFallback(block, escapeHtml, ids.fallback)}</figure>`;
}

function renderGraphNode(node, escapeHtml) {
  return `<article class="diagram-node-card ${roleClass(node.role, escapeHtml)}" data-node-id="${escapeHtml(node.id)}"><span class="diagram-role-label">${escapeHtml(node.role)}</span><strong class="diagram-node-label">${escapeHtml(node.label)}</strong><p class="diagram-node-detail">${escapeHtml(node.detail)}</p></article>`;
}

function renderDirectedConnection(connection, nodeById, connectionClass, escapeHtml) {
  const fromNode = nodeById.get(connection.from);
  const toNode = nodeById.get(connection.to);
  return `<div class="diagram-directed-connection ${connectionClass}" data-from="${escapeHtml(connection.from)}" data-to="${escapeHtml(connection.to)}"><span class="diagram-endpoint diagram-from">${escapeHtml(fromNode.label)}</span><span class="diagram-directed-label">${escapeHtml(connection.label)}</span><span class="diagram-direction" aria-hidden="true">→</span><span class="diagram-endpoint diagram-to">${escapeHtml(toNode.label)}</span></div>`;
}

function renderFallbackNodeList(nodes, escapeHtml) {
  const items = nodes.map(
    (node) =>
      `<li data-node-id="${escapeHtml(node.id)}"><strong>${escapeHtml(node.label)}</strong> <code>(${escapeHtml(node.id)})</code> <span class="diagram-role-label">— Role: ${escapeHtml(node.role)}.</span> <span class="diagram-node-detail">${escapeHtml(node.detail)}</span></li>`,
  ).join("\n");
  return `<p class="diagram-fallback-label"><strong>Nodes</strong>.</p>
<ol class="diagram-fallback-node-list">${items}</ol>`;
}

function renderRelationFallback(block, connections, escapeHtml, fallbackId) {
  const nodeById = new Map(block.nodes.map((node) => [node.id, node]));
  const rows = connections.map((connection) => {
    const fromNode = nodeById.get(connection.from);
    const toNode = nodeById.get(connection.to);
    return `<tr data-from="${escapeHtml(connection.from)}" data-to="${escapeHtml(connection.to)}"><td><strong>${escapeHtml(fromNode.label)}</strong> <code>(${escapeHtml(fromNode.id)})</code></td> <td>${escapeHtml(connection.label)}</td> <td><strong>${escapeHtml(toNode.label)}</strong> <code>(${escapeHtml(toNode.id)})</code></td></tr>`;
  }).join("\n");

  const tableLabel = escapeHtml(`${block.title} directed relations table`);
  return `<details id="${fallbackId}" class="diagram-fallback diagram-relation-fallback"><summary>View ${escapeHtml(block.title)} text and relation table.</summary>
${renderFallbackNodeList(block.nodes, escapeHtml)}
<div class="table-scroll-region" role="region" aria-label="${tableLabel}" tabindex="0"><table class="table diagram-fallback-table"><caption>${escapeHtml(block.title)} directed relations.</caption>
<thead><tr><th scope="col">From</th> <th scope="col">Relation</th> <th scope="col">To</th></tr></thead>
<tbody>${rows}</tbody></table></div></details>`;
}

function renderGraphDiagram(
  block,
  escapeHtml,
  {
    kindLabel,
    figureClass,
    visualClass,
    connectionField,
    connectionClass,
    ids,
  },
) {
  const nodeById = new Map(block.nodes.map((node) => [node.id, node]));
  const nodes = block.nodes.map((node) => renderGraphNode(node, escapeHtml)).join("");
  const connections = block[connectionField];
  const directedConnections = connections
    .map((connection) =>
      renderDirectedConnection(connection, nodeById, connectionClass, escapeHtml),
    )
    .join("");

  return `<figure class="rich-block rich-structured-diagram ${figureClass}" aria-labelledby="${ids.caption}" aria-describedby="${ids.summary}" aria-details="${ids.fallback}">${renderFigureHeading(block, kindLabel, escapeHtml, ids)}<div class="diagram-visual ${visualClass}" aria-hidden="true"><div class="diagram-mobile-linear"><div class="diagram-node-grid">${nodes}</div><div class="diagram-connection-sequence">${directedConnections}</div></div></div>${renderRelationFallback(block, connections, escapeHtml, ids.fallback)}</figure>`;
}

function renderFlowDiagram(block, escapeHtml, ids) {
  return renderGraphDiagram(block, escapeHtml, {
    kindLabel: "Flow diagram",
    figureClass: "flow-diagram",
    visualClass: "diagram-flow-grid",
    connectionField: "edges",
    connectionClass: "diagram-edge",
    ids,
  });
}

function renderRelationDiagram(block, escapeHtml, ids) {
  return renderGraphDiagram(block, escapeHtml, {
    kindLabel: "Relation diagram",
    figureClass: "relation-diagram",
    visualClass: "diagram-relation-spine",
    connectionField: "relations",
    connectionClass: "diagram-relation",
    ids,
  });
}

function renderStructuredDiagram(block, escapeHtml, context = {}) {
  const headingLevel = context.headingLevel || 5;
  const idPrefix = context.idPrefix || "diagram-1";
  const ids = {
    caption: `${idPrefix}-caption`,
    summary: `${idPrefix}-summary`,
    fallback: `${idPrefix}-fallback`,
  };
  if (block.type === "layerDiagram") {
    return renderLayerDiagram(block, escapeHtml, headingLevel, ids);
  }
  if (block.type === "flowDiagram") return renderFlowDiagram(block, escapeHtml, ids);
  if (block.type === "relationDiagram") return renderRelationDiagram(block, escapeHtml, ids);
  throw new Error(`Unsupported structured diagram type: ${block.type}`);
}

module.exports = { renderStructuredDiagram };
