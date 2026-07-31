"use strict";

const STRUCTURED_DIAGRAM_TYPES = new Set([
  "layerDiagram",
  "flowDiagram",
  "relationDiagram",
]);
const DIAGRAM_ROLES = new Set([
  "consumer",
  "surface",
  "session",
  "engine",
  "boundary",
  "value",
  "neutral",
]);
const DIAGRAM_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const DISALLOWED_CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const STRUCTURED_DIAGRAM_FIELDS = {
  layerDiagram: new Set(["type", "title", "summary", "layers"]),
  flowDiagram: new Set(["type", "title", "summary", "nodes", "edges"]),
  relationDiagram: new Set(["type", "title", "summary", "nodes", "relations"]),
};
const LAYER_FIELDS = new Set(["id", "label", "role", "summary", "nodes", "transition"]);
const LAYER_NODE_FIELDS = new Set(["id", "label", "detail"]);
const GRAPH_NODE_FIELDS = new Set(["id", "label", "detail", "role"]);
const CONNECTION_FIELDS = new Set(["from", "to", "label"]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isDiagramId(value) {
  return typeof value === "string" && DIAGRAM_ID_PATTERN.test(value);
}

function hasSafeDiagramText(value, { multiline = false } = {}) {
  if (
    typeof value !== "string"
    || value.trim().length === 0
    || DISALLOWED_CONTROL.test(value)
  ) {
    return false;
  }
  return multiline || !/[\n\r\t\u2028\u2029]/u.test(value);
}

function validateAllowedFields(value, allowedFields, errors, prefix) {
  if (!isPlainObject(value)) return;
  for (const field of Object.keys(value)) {
    if (!allowedFields.has(field)) {
      errors.push(
        `${prefix}${field} is not supported; allowed fields: ${Array.from(allowedFields).join(", ")}`,
      );
    }
  }
}

function requireObject(value, errors, path) {
  if (isPlainObject(value)) return true;
  errors.push(`${path} must be an object`);
  return false;
}

function requireDiagramText(object, field, errors, prefix, options) {
  if (!hasSafeDiagramText(object?.[field], options)) {
    const lineRule = options?.multiline ? "" : " single-line";
    errors.push(`${prefix}${field} must be a non-empty${lineRule} diagram string`);
  }
}

function requireDiagramId(object, field, errors, prefix) {
  if (!isDiagramId(object?.[field])) {
    errors.push(
      `${prefix}${field} must match ${DIAGRAM_ID_PATTERN}`,
    );
  }
}

function requireRole(object, errors, prefix) {
  if (!DIAGRAM_ROLES.has(object?.role)) {
    errors.push(`${prefix}role must be one of: ${Array.from(DIAGRAM_ROLES).join(", ")}`);
  }
}

function requireArray(value, minimum, errors, path) {
  if (!Array.isArray(value) || value.length < minimum) {
    errors.push(`${path} must be an array with at least ${minimum} item(s)`);
    return false;
  }
  return true;
}

function validateCommonFields(block, errors, prefix) {
  validateAllowedFields(block, STRUCTURED_DIAGRAM_FIELDS[block.type], errors, prefix);
  requireDiagramText(block, "title", errors, prefix);
  requireDiagramText(block, "summary", errors, prefix, { multiline: true });
}

function validateLayerNode(node, errors, prefix, nodeIds) {
  if (!requireObject(node, errors, prefix.slice(0, -1))) return;
  validateAllowedFields(node, LAYER_NODE_FIELDS, errors, prefix);
  requireDiagramId(node, "id", errors, prefix);
  requireDiagramText(node, "label", errors, prefix);
  requireDiagramText(node, "detail", errors, prefix, { multiline: true });

  if (isDiagramId(node.id)) {
    if (nodeIds.has(node.id)) {
      errors.push(`${prefix}id must be unique within the diagram block`);
    } else {
      nodeIds.add(node.id);
    }
  }
}

function validateLayerDiagram(block, errors, prefix) {
  if (!requireArray(block.layers, 1, errors, `${prefix}layers`)) return;
  const layerIds = new Set();
  const nodeIds = new Set();

  block.layers.forEach((layer, layerIndex) => {
    const layerPrefix = `${prefix}layers[${layerIndex}].`;
    if (!requireObject(layer, errors, layerPrefix.slice(0, -1))) return;
    validateAllowedFields(layer, LAYER_FIELDS, errors, layerPrefix);
    requireDiagramId(layer, "id", errors, layerPrefix);
    requireDiagramText(layer, "label", errors, layerPrefix);
    requireRole(layer, errors, layerPrefix);
    requireDiagramText(layer, "summary", errors, layerPrefix, { multiline: true });

    if (isDiagramId(layer.id)) {
      if (layerIds.has(layer.id)) {
        errors.push(`${layerPrefix}id must be unique within the diagram block`);
      } else {
        layerIds.add(layer.id);
      }
    }

    if (Object.hasOwn(layer, "transition")) {
      requireDiagramText(layer, "transition", errors, layerPrefix, { multiline: true });
      if (layerIndex === block.layers.length - 1) {
        errors.push(`${layerPrefix}transition is not allowed on the final layer`);
      }
    }

    if (!requireArray(layer.nodes, 1, errors, `${layerPrefix}nodes`)) return;
    layer.nodes.forEach((node, nodeIndex) => {
      validateLayerNode(node, errors, `${layerPrefix}nodes[${nodeIndex}].`, nodeIds);
    });
  });
}

function validateGraphNode(node, errors, prefix, nodeIds) {
  if (!requireObject(node, errors, prefix.slice(0, -1))) return;
  validateAllowedFields(node, GRAPH_NODE_FIELDS, errors, prefix);
  requireDiagramId(node, "id", errors, prefix);
  requireDiagramText(node, "label", errors, prefix);
  requireDiagramText(node, "detail", errors, prefix, { multiline: true });
  requireRole(node, errors, prefix);

  if (isDiagramId(node.id)) {
    if (nodeIds.has(node.id)) {
      errors.push(`${prefix}id must be unique within the diagram block`);
    } else {
      nodeIds.add(node.id);
    }
  }
}

function validateConnections(block, field, errors, prefix, nodeIds, nodes) {
  const connections = block[field];
  if (!requireArray(connections, 1, errors, `${prefix}${field}`)) return;

  const seenConnections = new Set();
  const participatingNodeIds = new Set();
  connections.forEach((connection, connectionIndex) => {
    const connectionPrefix = `${prefix}${field}[${connectionIndex}].`;
    if (!requireObject(connection, errors, connectionPrefix.slice(0, -1))) return;
    validateAllowedFields(connection, CONNECTION_FIELDS, errors, connectionPrefix);
    requireDiagramId(connection, "from", errors, connectionPrefix);
    requireDiagramId(connection, "to", errors, connectionPrefix);
    requireDiagramText(connection, "label", errors, connectionPrefix);

    for (const endpoint of ["from", "to"]) {
      if (isDiagramId(connection[endpoint]) && !nodeIds.has(connection[endpoint])) {
        errors.push(`${connectionPrefix}${endpoint} must reference a node in this diagram block`);
      } else if (nodeIds.has(connection[endpoint])) {
        participatingNodeIds.add(connection[endpoint]);
      }
    }

    if (
      isDiagramId(connection.from)
      && isDiagramId(connection.to)
      && connection.from === connection.to
    ) {
      errors.push(`${connectionPrefix}to must not create a self-edge`);
    }

    if (
      isDiagramId(connection.from)
      && isDiagramId(connection.to)
      && hasSafeDiagramText(connection.label)
    ) {
      const tuple = JSON.stringify([connection.from, connection.to, connection.label]);
      if (seenConnections.has(tuple)) {
        errors.push(
          `${connectionPrefix.slice(0, -1)} duplicates an earlier from, to, label tuple`,
        );
      } else {
        seenConnections.add(tuple);
      }
    }
  });

  nodes.forEach((node, nodeIndex) => {
    if (isDiagramId(node?.id) && !participatingNodeIds.has(node.id)) {
      errors.push(`${prefix}nodes[${nodeIndex}].id must participate in at least one ${field === "edges" ? "edge" : "relation"}`);
    }
  });
}

function validateGraphDiagram(block, errors, prefix) {
  if (!requireArray(block.nodes, 2, errors, `${prefix}nodes`)) return;
  const nodeIds = new Set();
  block.nodes.forEach((node, nodeIndex) => {
    validateGraphNode(node, errors, `${prefix}nodes[${nodeIndex}].`, nodeIds);
  });

  const connectionField = block.type === "flowDiagram" ? "edges" : "relations";
  validateConnections(block, connectionField, errors, prefix, nodeIds, block.nodes);
}

function validateStructuredDiagram(block, errors, prefix) {
  validateCommonFields(block, errors, prefix);
  if (block.type === "layerDiagram") {
    validateLayerDiagram(block, errors, prefix);
  } else {
    validateGraphDiagram(block, errors, prefix);
  }
}

module.exports = {
  STRUCTURED_DIAGRAM_TYPES,
  DIAGRAM_ROLES,
  DIAGRAM_ID_PATTERN,
  DISALLOWED_CONTROL,
  isDiagramId,
  hasSafeDiagramText,
  validateStructuredDiagram,
};
