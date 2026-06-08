/**
 * Antigravity Handoff Generator for Trello List Exporter
 * Generates a markdown handoff file suitable for pasting into AI development workflows
 */

function normalizeAttachment(attachment) {
  return {
    id: attachment && attachment.id ? attachment.id : '',
    name: attachment && attachment.name ? attachment.name : '',
    url: attachment && attachment.url ? attachment.url : '',
    mimeType: attachment && attachment.mimeType ? attachment.mimeType : '',
    isUpload: attachment && attachment.isUpload ? attachment.isUpload : false,
    bytes: attachment && attachment.bytes ? attachment.bytes : null,
  };
}

function formatCardForHandoff(card) {
  const lines = [];

  // Card title
  lines.push(`## ${card.name || 'Untitled Card'}`);
  lines.push('');

  // Status / List
  if (card.list && card.list.name) {
    lines.push(`**Status:** ${card.list.name}`);
  }

  // Labels
  if (Array.isArray(card.labels) && card.labels.length > 0) {
    const labelNames = card.labels
      .map(function (label) {
        return label && label.name ? label.name : '';
      })
      .filter(Boolean);
    if (labelNames.length > 0) {
      lines.push(`**Labels:** ${labelNames.join(', ')}`);
    }
  }

  // Due date
  if (card.due) {
    const dueDate = new Date(card.due);
    const dueDateStr = dueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    lines.push(
      `**Due:** ${dueDateStr}${card.dueComplete ? ' (Complete)' : ''}`
    );
  }

  lines.push('');

  // Description / Details
  if (card.desc && card.desc.trim()) {
    lines.push('### Description');
    lines.push(card.desc);
    lines.push('');
  }

  // Members
  if (Array.isArray(card.members) && card.members.length > 0) {
    const memberNames = card.members
      .map(function (member) {
        return member && member.fullName ? member.fullName : member.username || '';
      })
      .filter(Boolean);
    if (memberNames.length > 0) {
      lines.push('### Assigned To');
      memberNames.forEach(function (name) {
        lines.push(`- ${name}`);
      });
      lines.push('');
    }
  }

  // Attachments
  if (Array.isArray(card.attachments) && card.attachments.length > 0) {
    lines.push('### Attachments');
    card.attachments.forEach(function (attachment) {
      const normalizedAttachment = normalizeAttachment(attachment);
      if (normalizedAttachment.url) {
        lines.push(`- [${normalizedAttachment.name}](${normalizedAttachment.url})`);
      } else {
        lines.push(`- ${normalizedAttachment.name}`);
      }
    });
    lines.push('');
  }

  // Card URL
  if (card.url) {
    lines.push(`[View in Trello](${card.url})`);
    lines.push('');
  }

  return lines.join('\n');
}

function createHandoffMarkdown(board, list, cards) {
  const lines = [];

  // Header
  lines.push(`# Trello List Export - Antigravity Handoff`);
  lines.push('');

  // Metadata
  lines.push('## Export Metadata');
  lines.push('');
  lines.push(`**Exported:** ${new Date().toISOString()}`);
  lines.push(`**Board:** ${board && board.name ? board.name : 'Unknown Board'}`);
  lines.push(`**List:** ${list && list.name ? list.name : 'Unknown List'}`);
  lines.push(`**Total Cards:** ${cards.length}`);
  lines.push('');

  // Privacy notice
  lines.push('---');
  lines.push('');
  lines.push('## Privacy & Usage');
  lines.push('');
  lines.push(
    'This handoff was generated locally in your browser. Share only with authorized team members.'
  );
  lines.push('');

  // Cards
  if (cards.length > 0) {
    lines.push('## Cards');
    lines.push('');

    cards.forEach(function (card, index) {
      if (index > 0) {
        lines.push('---');
        lines.push('');
      }
      lines.push(formatCardForHandoff(card));
    });
  } else {
    lines.push('## No Cards');
    lines.push('');
    lines.push('This list contains no cards to export.');
    lines.push('');
  }

  return lines.join('\n');
}

function downloadHandoff(board, list, cards, filename) {
  const handoffContent = createHandoffMarkdown(board, list, cards);
  const blob = new Blob([handoffContent], {
    type: 'text/markdown;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildHandoffFilename(boardName, listName) {
  const safeComponent = function (value) {
    return String(value || '')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'export';
  };
  const board = safeComponent(boardName || 'board');
  const list = safeComponent(listName || 'list');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `handoff_${board}_${list}_${timestamp}.md`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeAttachment,
    formatCardForHandoff,
    createHandoffMarkdown,
    downloadHandoff,
    buildHandoffFilename,
  };
}
