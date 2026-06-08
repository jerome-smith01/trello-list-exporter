/**
 * CSV Serializer for Trello List Exporter
 * Handles escaping, formula injection prevention, and UTF-8 BOM
 */

function escapeCSVCell(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Prevent formula injection by prefixing dangerous characters
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`;
  }

  // Escape quotes and wrap in quotes if cell contains special characters
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function buildCSVRow(values) {
  return values.map(escapeCSVCell).join(',');
}

function createCSVContent(board, list, cards) {
  const rows = [];

  // Add header row with column names
  const headers = [
    'Card ID',
    'Card Short ID',
    'Card Name',
    'Description',
    'Labels',
    'Members',
    'Start Date',
    'Due Date',
    'Due Completion',
    'Card URL',
    'Last Activity',
  ];

  rows.push(buildCSVRow(headers));

  // Add data rows
  cards.forEach(function (card) {
    const labels = Array.isArray(card.labels)
      ? card.labels.map(function (label) {
          return label && label.name ? label.name : '';
        }).join(';')
      : '';

    const members = Array.isArray(card.members)
      ? card.members
          .map(function (member) {
            return member && member.username ? member.username : '';
          })
          .join(';')
      : '';

    const row = [
      card.id || '',
      card.idShort || '',
      card.name || '',
      card.desc || '',
      labels,
      members,
      card.start || '',
      card.due || '',
      card.dueComplete ? 'Yes' : 'No',
      card.url || '',
      card.dateLastActivity || '',
    ];

    rows.push(buildCSVRow(row));
  });

  const csvContent = rows.join('\n');

  // Add UTF-8 BOM for better Excel compatibility
  const bomChar = '\uFEFF';
  return bomChar + csvContent;
}

function downloadCSV(board, list, cards, filename) {
  const csvContent = createCSVContent(board, list, cards);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeCSVCell,
    buildCSVRow,
    createCSVContent,
    downloadCSV,
  };
}
