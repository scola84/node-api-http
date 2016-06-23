export default function (header) {
  if (!header) {
    return header;
  }

  const regexp = /([^\s,;=]+)=(?:([\'"])([^\2]+?)\2|([^\s,;=]+))/;
  const match = header.match(new RegExp(regexp.source, 'g')) || [];

  const values = {};
  let partMatch = null;
  let index = null;

  match.forEach((part) => {
    partMatch = part.match(regexp);
    index = typeof partMatch[2] === 'undefined' ? 4 : 3;
    values[partMatch[1].toLowerCase()] = partMatch[index];
    header = header.replace(part, '');
  });

  values[0] = header.replace(/[\s;,]/g, '');

  return values;
}
