"use strict";

function roleClass(role, escapeHtml) {
  return `diagram-role-${escapeHtml(role)}`;
}

function renderFigureHeading(block, kindLabel, escapeHtml) {
  return `<figcaption><span class="badge">${kindLabel}</span><strong>${escapeHtml(block.title)}</strong></figcaption><p class="diagram-summary">${escapeHtml(block.summary)}</p>`;
}

function renderLayerNode(node, escapeHtml) {
  return `<article class="diagram-node-card" data-node-id="${escapeHtml(node.id)}"><strong class="diagram-node-label">${escapeHtml(node.label)}</strong><p class="diagram-node-detail">${escapeHtml(node.detail)}</p></article>`;
}

function renderLayerFallback(block, escapeHtml) {
  const layers = block.layers.map((layer) => {
    const nodes = layer.nodes
      .map(
        (node) =>
          `<li data-node-id="${escapeHtml(node.id)}"><strong>${escapeHtml(node.label)}</strong><span> ${escapeHtml(node.detail)}</span></li>`,
      )
      .join("");
    const transition = layer.transition
      ? `<p class="diagram-fallback-transition"><strong>Transition:</strong> ${escapeHtml(layer.transition)}</p>`
      : "";
    return `<li data-layer-id="${escapeHtml(layer.id)}"><strong>${escapeHtml(layer.label)}</strong><span class="diagram-role-label">Role: ${escapeHtml(layer.role)}</span><p>${escapeHtml(layer.summary)}</p><ol class="diagram-fallback-node-list">${nodes}</ol>${transition}</li>`;
  }).join("");

  return `<ol class="diagram-fallback diagram-layer-fallback visually-hidden">${layers}</ol>`;
}

function renderLayerDiagram(block, escapeHtml) {
  const layers = block.layers.map((layer, index) => {
    const nodes = layer.nodes.map((node) => renderLayerNode(node, escapeHtml)).join("");
    const transition = layer.transition
      ? `<div class="diagram-layer-transition" data-from="${escapeHtml(layer.id)}" data-to="${escapeHtml(block.layers[index + 1].id)}"><span class="diagram-directed-label">${escapeHtml(layer.transition)}</span></div>`
      : "";
    return `<section class="diagram-layer ${roleClass(layer.role, escapeHtml)}" data-layer-id="${escapeHtml(layer.id)}"><div class="diagram-role-rail"><span class="diagram-role-label">${escapeHtml(layer.role)}</span></div><div class="diagram-layer-content"><h5>${escapeHtml(layer.label)}</h5><p>${escapeHtml(layer.summary)}</p><div class="diagram-layer-nodes">${nodes}</div></div></section>${transition}`;
  }).join("");

  return `<figure class="rich-block rich-structured-diagram layer-diagram">${renderFigureHeading(block, "Layer diagram", escapeHtml)}<div class="diagram-visual diagram-layer-stack" aria-hidden="true"><div class="diagram-mobile-linear">${layers}</div></div>${renderLayerFallback(block, escapeHtml)}</figure>`;
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
      `<li data-node-id="${escapeHtml(node.id)}"><strong>${escapeHtml(node.label)}</strong><span class="diagram-role-label">Role: ${escapeHtml(node.role)}</span><p>${escapeHtml(node.detail)}</p></li>`,
  ).join("");
  return `<h5>Nodes</h5><ol class="diagram-fallback-node-list">${items}</ol>`;
}

function renderRelationFallback(block, connections, escapeHtml) {
  const nodeById = new Map(block.nodes.map((node) => [node.id, node]));
  const rows = connections.map((connection) => {
    const fromNode = nodeById.get(connection.from);
    const toNode = nodeById.get(connection.to);
    return `<tr data-from="${escapeHtml(connection.from)}" data-to="${escapeHtml(connection.to)}"><td><strong>${escapeHtml(fromNode.label)}</strong><code>${escapeHtml(fromNode.id)}</code></td><td>${escapeHtml(connection.label)}</td><td><strong>${escapeHtml(toNode.label)}</strong><code>${escapeHtml(toNode.id)}</code></td></tr>`;
  }).join("");

  return `<details class="diagram-fallback diagram-relation-fallback"><summary>View diagram text and relation table</summary>${renderFallbackNodeList(block.nodes, escapeHtml)}<table class="table diagram-fallback-table"><caption>${escapeHtml(block.title)} directed relations</caption><thead><tr><th scope="col">From</th><th scope="col">Relation</th><th scope="col">To</th></tr></thead><tbody>${rows}</tbody></table></details>`;
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

  return `<figure class="rich-block rich-structured-diagram ${figureClass}">${renderFigureHeading(block, kindLabel, escapeHtml)}<div class="diagram-visual ${visualClass}" aria-hidden="true"><div class="diagram-mobile-linear"><div class="diagram-node-grid">${nodes}</div><div class="diagram-connection-sequence">${directedConnections}</div></div></div>${renderRelationFallback(block, connections, escapeHtml)}</figure>`;
}

function renderFlowDiagram(block, escapeHtml) {
  return renderGraphDiagram(block, escapeHtml, {
    kindLabel: "Flow diagram",
    figureClass: "flow-diagram",
    visualClass: "diagram-flow-grid",
    connectionField: "edges",
    connectionClass: "diagram-edge",
  });
}

function renderRelationDiagram(block, escapeHtml) {
  return renderGraphDiagram(block, escapeHtml, {
    kindLabel: "Relation diagram",
    figureClass: "relation-diagram",
    visualClass: "diagram-relation-spine",
    connectionField: "relations",
    connectionClass: "diagram-relation",
  });
}

function renderStructuredDiagram(block, escapeHtml) {
  if (block.type === "layerDiagram") return renderLayerDiagram(block, escapeHtml);
  if (block.type === "flowDiagram") return renderFlowDiagram(block, escapeHtml);
  if (block.type === "relationDiagram") return renderRelationDiagram(block, escapeHtml);
  throw new Error(`Unsupported structured diagram type: ${block.type}`);
}

module.exports = { renderStructuredDiagram };
