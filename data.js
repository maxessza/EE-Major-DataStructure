window.DSA_TOPICS = [];
function dsaStableShuffle(items, seed) {
  var out = items.slice();
  var hash = 2166136261;
  String(seed).split('').forEach(function (char) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  });
  for (var i = out.length - 1; i > 0; i--) {
    hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0;
    var j = hash % (i + 1);
    var temp = out[i]; out[i] = out[j]; out[j] = temp;
  }
  return out;
}
window.DSA_SHUFFLE_CHOICES = function (question, seed) {
  var indexed = question[3].map(function (text, index) { return { text: text, index: index }; });
  var shuffled = dsaStableShuffle(indexed, seed);
  var result = question.slice();
  result[3] = shuffled.map(function (item) { return item.text; });
  result[4] = shuffled.findIndex(function (item) { return item.index === question[4]; });
  var hash = 2166136261;
  String(seed).split('').forEach(function (char) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  });
  hash ^= hash >>> 16;
  hash >>>= 0;
  var target = hash % result[3].length;
  var shift = (target - result[4] + result[3].length) % result[3].length;
  if (shift) result[3] = result[3].slice(result[3].length - shift).concat(result[3].slice(0, result[3].length - shift));
  result[4] = target;
  return result;
};
window.DSA_BUILD_RECORD = function (topic, question, index) {
  var id = topic.id + '-' + String(index + 1).padStart(2, '0');
  var shuffled = window.DSA_SHUFFLE_CHOICES(question, id);
  return {
    id: id, topicId: topic.id, topicTitle: topic.title,
    type: shuffled[0], prompt: shuffled[1], code: shuffled[2], options: shuffled[3],
    answer: shuffled[4], explanation: shuffled[5], difficulty: shuffled[6]
  };
};
window.DSA_BUILD_ASSERTION = function (prompt, isFalse, explanation, difficulty) {
  var banks = [
    { re: /hash|collision|probing|load factor|bucket|hashcode|tombstone|rehash|hash table|separate chaining|linear probing/i, items: [
      'A collision can occur only when two keys are equal according to equals.',
      'A good hash function guarantees that the table will have no collisions.',
      'In linear probing, an entry can always be deleted by marking its slot empty without affecting later searches.'
    ] },
    { re: /tree|\bBST\b|root|leaf|traversal|subtree|parent|child|duplicate.*(?:right|ขวา)|ลงขวา/i, items: [
      'Inorder traversal produces sorted values for every binary tree.',
      'A BST balances itself automatically regardless of insertion order.',
      'Searching a BST always takes O(log n), even when the tree is a chain.'
    ] },
    { re: /graph|\bvertex\b|\bvertices\b|\bBFS\b|\bDFS\b|adjacency|Euler|Hamiltonian|directed graph|undirected graph/i, items: [
      'BFS guarantees the minimum total-weight path even when edges have different weights.',
      'In a directed graph, an edge u → v always allows travel from v back to u.',
      'An Euler path visits every vertex once, while a Hamiltonian path uses every edge once.'
    ] },
    { re: /queue|fifo|enqueue|dequeue|front|rear|wrap-around|คิว/i, items: [
      'A queue is LIFO, so the most recently enqueued item is removed first.',
      'A standard enqueue adds an item at the front, and dequeue removes one from the rear.',
      'An index in a circular queue does not need to wrap around when it reaches capacity.'
    ] },
    { re: /postfix|infix|bracket|push|pop|peek|lifo|บนสุด|วงเล็บ/i, items: [
      'A stack is FIFO, so the earliest pushed item is removed first.',
      'peek() removes the top item and decreases the size just like pop().',
      'When evaluating a - b from postfix notation, the operands can be reversed to b - a.'
    ] },
    { re: /recursive|recursion|base case|call stack|fib|hanoi|factorial|sum\(/i, items: [
      'All recursive calls share the same set of local variables.',
      'Recursion stops automatically when the stack has enough calls, even without a base case.',
      'The recursive Fibonacci calls F(n-1) and F(n-2) compute each value only once.'
    ] },
    { re: /binary search|linear search|sort|sorted|insertion|selection|bubble|merge|pivot|stable|เรียง/i, items: [
      'Binary search can correctly halve the search range even when the data is unsorted.',
      'Basic selection sort stops immediately in the best case when the data is already sorted.',
      'A stable sort may reorder equal-key items in any order.'
    ] },
    { re: /circular|doubly|\bDLL\b|sentinel|วงกลม/i, items: [
      'Having a prev pointer makes any node searchable in O(1), even without a reference to it.',
      'The last node of a circular list must have next set to null to end traversal.',
      'When simplifying 7n + 20 in Big-O notation, the coefficient 7 must be kept, so the result is O(7n).'
    ] },
    { re: /array|อาร์เรย์|index|reference/i, items: [
      'Assigning b = a automatically copies every element into a separate array.',
      'An array can grow or shrink its length when code writes past the last slot.',
      'The last array index equals length, so a loop can use i <= length.'
    ] },
    { re: /linked.?list|singly linked|\bSLL\b|head|tail|node|ลิงก์|ลิสต์/i, items: [
      'Accessing the kth node takes O(1) because every node has an index.',
      'A singly linked list can move backward from the tail without a prev pointer.',
      'When only head is stored, appending is still O(1) without searching for the tail.'
    ] },
    { re: /big-o|complexity|\bO\s*\(|nested loops|ลูปซ้อน|ลูป|เวลา/i, items: [
      'Nested loops multiply their iteration counts, while sequential loops add them.',
      'Big-O must always keep the coefficient of the dominant term, such as O(7n).',
      'A loop that doubles its variable runs in O(n) because it performs several updates.'
    ] }
  ];
  var context = prompt + ' ' + explanation;
  var bank = banks.find(function (item) { return item.re.test(prompt); }) ||
    banks.find(function (item) { return item.re.test(context); }) || {
    items: [
      'The answer depends on the amount of stored data, but not on operation order or representation.',
      'Edge cases do not affect results, so checking the structure invariant is unnecessary.',
      'Every implementation of this structure always has the same complexity and behavior.'
    ]
  };
  var distractors = bank.items.slice();
  if (isFalse) distractors[0] = prompt;
  var choices = [explanation];
  function add(text) {
    if (text && choices.length < 4 && choices.indexOf(text) < 0) choices.push(text);
  }
  distractors.forEach(add);
  var fallback = [
    'Edge cases do not affect results, so checking the structure invariant is unnecessary.',
    'Every implementation of this structure always has the same complexity and behavior.'
  ];
  for (var j = 0; choices.length < 4 && j < fallback.length; j++) add(fallback[j]);
  return ['logic', 'Consider the statement: “' + prompt + '”\nChoose the most accurate explanation.', '', choices.slice(0, 4),
    choices.indexOf(explanation), explanation, difficulty || 'Challenging'];
};
window.DSA_BUILD_FILL = function (prompt, code, accepted, explanation, difficulty) {
  var answer = Array.isArray(accepted) ? String(accepted[0]) : String(accepted);
  var key = answer.toLowerCase().replace(/\s+/g, '');
  var banks = {
    'i<a.length': ['i <= a.length', 'i < a.length - 1', 'i < a.length - 2'],
    'a.length-1': ['a.length', 'a.length + 1', 'size - 1'],
    'a.length': ['a.length - 1', 'size', 'capacity'],
    '!=': ['==', '<=', '>='], '==': ['!=', '<', '<='], '<': ['<=', '>', '>='],
    '<=': ['<', '==', '>'], '>': ['>=', '<', '<='], '>=': ['>', '==', '<'],
    '+': ['-', '*', '%'], '-': ['+', '*', '/'], '%': ['/', '*', '+'],
    'p!=null': ['p == null', 'p.next != null', 'p != head'],
    'size-1': ['size', 'size + 1', 'capacity - 1'],
    'size==0': ['size != 0', 'size < 0', 'size <= -1'],
    'size': ['size - 1', 'size + 1', 'capacity'],
    'head.next': ['head', 'head.next.next', 'tail'],
    'tail.next': ['tail', 'head', 'tail.next.next'],
    'table.length': ['table[0].length', 'table.length - 1', 'table[1].length'],
    'n': ['n - 1', 'size', 'capacity'],
    'a': ['b', 'pop()', 'peek()'], 'push': ['pop', 'peek', 'add'],
    'next': ['prev', 'data', 'next.next'],
    'x': ['a', 'b', 'x.next'], 'p': ['q', 'r', 'head'], 'prev': ['next', 'head', 'tail'],
    'n-1': ['n + 1', 'n', 'n - 2'], 'n/2': ['n - 1', 'n / 2 + 1', 'n / 2 - 1'],
    'n<=1': ['n == 0', 'n == 1', 'n < 1'],
    'high-low': ['high + low', 'high', 'low'],
    'left,right': ['node, left, right', 'right, node, left', 'left, right, node'],
    'p==null': ['p != null', 'p.left == null', 'node == null'],
    'p.next!=start': ['p != start', 'p.next == start', 'p != null'],
    'j': ['j + 1', 'j - 1', 'i'], 'log2(n)': ['n', 'n²', 'n log n'],
    'v-1': ['V', 'V + 1', 'E - 1'],
    '0.5': ['0.25', '0.75', '1.5'], 'capacity': ['size', 'capacity - 1', 'n'],
    '-1': ['0', '1', 'null'],
    '--size': ['size--', 'size - 1', 'size'],
    'stack.isempty()': ['stack.isFull()', 'stack == null', '!stack.isEmpty()'],
    '34+2*': ['3 4 2 * +', '3 4 * 2 -', '3 4 + 2 /'],
    '2*t(n-1)': ['T(n - 1) + 1', '2 * T(n)', 'T(n - 2) + 1'],
    '2*i+2': ['2 * i + 1', '2 * i', 'i + 2'],
    '2^(h+1)-1': ['2^h - 1', '2 * h + 1', '2^(h + 1)'],
    'n*(n-1)/2': ['n * (n - 1)', 'n * n', 'n * (n + 1) / 2'],
    'vxv': ['V x E', 'E x E', 'V + E'], 'v²': ['V', 'E', 'V + E'],
    'n/(double)m': ['m / (double) n', 'n * m', 'n / m'],
    'floormod': ['abs', 'round', 'ceil'], 'visited': ['distance', 'parent', 'queue'],
    'queue': ['stack', 'list', 'visited'], 'stack': ['queue', 'list', 'visited'],
    'left': ['right', 'parent', 'root'], 'right': ['left', 'parent', 'root'],
    'front': ['rear', 'head', 'tail'], 'rear': ['front', 'head', 'tail'],
    'vertex': ['edge', 'path', 'neighbor'], 'edge': ['vertex', 'path', 'neighbor'],
    'sequence': ['index', 'capacity', 'bucket'], 'rehash': ['resort', 'recount', 'resize only'],
    'key': ['index', 'hash code', 'bucket'], 'node': ['tail', 'head', 'node.next'],
    'newnode': ['head', 'tail', 'newNode.next'], 'null': ['head', 'tail', 'node'],
    'add': ['remove', 'contains', 'clear'], '0': ['1', '-1', 'n'], '1': ['0', '-1', 'n'],
    '3': ['2', '4', '5'], '==0': ['!= 0', '< 0', '> 0'], '++': ['--', '+= 2', '= 0'],
    '--': ['++', '-= 2', '= 0'], 'o(n)': ['O(1)', 'O(log n)', 'O(n²)'],
    'o(logn)': ['O(1)', 'O(n)', 'O(n²)'], 'o(n²)': ['O(n)', 'O(n log n)', 'O(log n)'],
    'print(n)': ['print(n - 1)', 'print(0)', 'return n'],
    'mid-1': ['mid', 'mid + 1', 'low - 1'], 'j+1': ['j', 'j - 1', 'i + 1'],
    'left,right': ['node, left, right', 'right, node, left', 'left, right, node']
  };
  var candidates = (banks[key] || []).slice();
  var codeText = (code || '').toLowerCase();
  if (candidates.length < 3 && /o\(|complexity|big-o/.test((prompt + ' ' + codeText).toLowerCase())) {
    candidates = candidates.concat(['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)']);
  }
  if (candidates.length < 3 && /\.next|head|tail|node|prev/.test(codeText)) {
    candidates = candidates.concat(['head', 'tail', 'node.next', 'node.prev', 'null']);
  }
  if (candidates.length < 3 && /for\s*\(|while\s*\(|index|length|size/.test(codeText)) {
    candidates = candidates.concat(['i < n', 'i <= n', 'n - 1', 'size', 'capacity']);
  }
  if (key === 'next' && /header\./.test(codeText)) candidates = ['prev', 'next.next', 'first'];
  if (key === 'next' && /target\./.test(codeText)) candidates = ['prev', 'data', 'next.next'];
  if (key === 'p==null' && /preorder/.test(codeText)) candidates = ['p != null', 'p.left == null && p.right == null', 'p.left == null'];
  if (key === 'size' && /\[____\+\+\]/.test(codeText)) candidates = ['size - 1', 'top', 'rear'];
  if (key === 'capacity' && /size\s*==/.test(codeText)) candidates = ['size', 'capacity - 1', 'n'];
  if (key === 'push' && /operators/.test(codeText)) candidates = ['pop', 'peek', 'add'];
  if (key === 'a' && /int a = pop/.test(codeText)) candidates = ['b', 'pop()', 'peek()'];
  if (key === 'left,right' || key === 'left, right') candidates = ['node, left, right', 'right, node, left', 'left, right, node'];
  candidates = candidates.filter(function (item, index, list) {
    return String(item).toLowerCase().replace(/\s+/g, '') !== key &&
      list.indexOf(item) === index;
  });
  var options = [answer];
  candidates.forEach(function (item) {
    if (options.length < 4 && options.map(function (v) { return String(v).toLowerCase().replace(/\s+/g, ''); })
      .indexOf(String(item).toLowerCase().replace(/\s+/g, '')) < 0) options.push(String(item));
  });
  var fallbacks = /O\(|complexity|Big-O/i.test(prompt + ' ' + codeText)
    ? ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)']
    : /\.next|head|tail|node|prev|header/i.test(codeText)
      ? ['head', 'tail', 'node.next', 'node.prev', 'null']
      : /for\s*\(|while\s*\(|index|length|size/i.test(codeText)
        ? ['i', 'j', 'size', 'capacity', 'n - 1']
        : ['node', 'queue', 'stack', 'index', 'size'];
  for (var i = 0; options.length < 4 && i < fallbacks.length; i++) {
    if (options.indexOf(fallbacks[i]) < 0 && fallbacks[i].toLowerCase().replace(/\s+/g, '') !== key) options.push(fallbacks[i]);
  }
  return ['fill', prompt, code, options, options.indexOf(answer), explanation, difficulty || 'Challenging'];
};
const C = (p, o, a, e, d = 'Medium') => ['concept', p, '', o, a, e, d];
const T = (p, a, e, d = 'Medium') => window.DSA_BUILD_ASSERTION(p, a === 1, e, d);
const R = (p, code, o, a, e, d = 'Medium') => ['trace', p, code, o, a, e, d];
const F = (p, code, a, e, d = 'Medium') => window.DSA_BUILD_FILL(p, code, a, e, d);

window.DSA_TOPICS.push({
  id: 'arrays', title: 'Fundamentals and Arrays', icon: '▦',
  description: 'Choose a suitable structure, use array indexes, and trace loops carefully.',
  questions: [
    C('Why do data-hiding classes often make fields private and provide methods for access?', ['To hide implementation details and protect invariants', 'To make every method run in O(1)', 'Because Java does not allow public fields', 'To reduce the memory used by an object'], 0, 'Controlled access helps preserve valid state, such as keeping size non-negative.'),
    C('Which structure is suitable when you often read any position and the number of elements rarely changes?', ['Singly linked list', 'Array', 'Stack', 'Queue'], 1, 'An array provides O(1) access by index; a linked list must be traversed from its first node.'),
    C('An array has 8 elements. What is its valid index range?', ['1 to 8', '0 to 8', '0 to 7', '1 to 7'], 2, 'Java arrays start at index 0, so the last index is length - 1.'),
    C('If int[][] grid has 4 rows and 3 entries in each row, what does grid.length return?', ['3', '4', '7', '12'], 1, 'The outer array length is the number of rows; grid[0].length is the number of entries in the first row.'),
    C('How can you make a copy of an array so that edits to it do not affect the original?', ['int[] b = a;', 'Create a new int[] and copy the elements', 'int[] b = {a.length};', 'int[] b = null;'], 1, 'b = a makes both variables refer to the same array. Create a new array and copy its elements.', 'Challenging'),
    C('In Java, what does a == b primarily check when a and b are arrays?', ['Whether every element is equal', 'Whether their lengths are equal', 'Whether they refer to the same object', 'Whether their sums are equal'], 2, 'For references, == checks identity. To compare elements, iterate through them or use an appropriate method.', 'Challenging'),
    T('After int[] a = new int[5] is created, the number of slots in a can later grow or shrink.', 1, 'A Java array has a fixed length after creation, although its element values can change.'),
    T('The statement int[] b = a; creates a separate copy of every element.', 1, 'This copies the reference, not the contents. A change to b[0] is also visible through a[0].', 'Challenging'),
    T('In Java, a two-dimensional array may have rows of different lengths.', 0, 'An int[][] is an array of arrays, so each row may have a different length.', 'Challenging'),
    T('Elements in a newly created int[] are initialized to 0 if no values are assigned.', 0, 'The default value for primitive int elements in an array is 0.'),
    R('What is the value of sum when the program finishes?', 'int[] a = {4, 2, 5};\nint sum = 0;\nfor (int x : a) sum += x;\nSystem.out.print(sum);', ['9', '11', '20', '452'], 1, 'The enhanced for loop reads 4, 2, and 5, so the sum is 4 + 2 + 5 = 11.'),
    R('What are the elements of a after the loop?', 'int[] a = new int[4];\nfor (int i = 0; i < a.length; i++) {\n  a[i] = i * 2;\n}', ['{0, 2, 4, 6}', '{2, 4, 6, 8}', '{0, 1, 2, 3}', '{0, 2, 4, 8}'], 0, 'i takes the values 0, 1, 2, and 3; the loop stores 2*i at each position.'),
    R('What does the code print?', 'int[] a = {7, 3, 9};\nfor (int i = a.length - 1; i >= 0; i--)\n  System.out.print(a[i] + " ");', ['7 3 9', '9 3 7', '9 7 3', '3 7 9'], 1, 'The loop starts at index 2 and decreases to 0, so it reads the elements in reverse order.'),
    R('What value is printed?', 'int[][] x = {{1, 2}, {3, 4}};\nint total = 0;\nfor (int r = 0; r < x.length; r++)\n  for (int c = 0; c < x[r].length; c++) total += x[r][c];\nSystem.out.print(total);', ['6', '8', '10', '24'], 2, 'The loops visit all four entries and add 1 + 2 + 3 + 4 = 10.'),
    R('What is the value of max after the loop?', 'int[] a = {-4, -2, -9};\nint max = a[0];\nfor (int i = 1; i < a.length; i++)\n  if (a[i] > max) max = a[i];', ['-9', '-4', '-2', '0'], 2, 'max starts at -4 and changes to -2. The value -9 is not greater than -2.', 'Challenging'),
    F('Complete the loop condition so every element is read without going out of bounds.', 'for (int i = 0; ____; i++) {\n  System.out.println(a[i]);\n}', 'i < a.length', 'The last index is a.length - 1, so the loop stops when i reaches length.'),
    F('Fill in the index of the last element in an array.', 'int lastIndex = ____;', ['a.length - 1', 'a.length-1'], 'Length is the number of slots, but indexes start at zero.'),
    F('Create the destination array with the same number of slots before copying.', 'int[] copy = new int[____];', 'a.length', 'The destination must have enough space for every element in a.'),
    F('Fill in the condition that detects a difference at position i in two arrays.', 'if (a[i] ____ b[i]) {\n  return false;\n}', '!=', 'If the values differ at any position, the arrays are not equal.', 'Challenging'),
    F('Fill in the number of rows in the two-dimensional array table.', 'int rowCount = ____;', 'table.length', 'The outer array stores a reference to each row.')
  ]
});

window.DSA_TOPICS.push({
  id: 'singly', title: 'Singly Linked Lists', icon: '⇢',
  description: 'Trace head, tail, and next pointers, including empty and single-node cases.',
  questions: [
    C('What is a key advantage of a linked list over an array?', ['O(1) access to every position', 'Insert or delete at a known reference without shifting a range of elements', 'It always uses less memory than an array', 'It always searches for a value in O(1)'], 1, 'Links let the structure change by updating references, but finding a position still requires traversal.'),
    C('In a nonempty singly linked list with both head and tail, what does appending a node do?', ['Set tail.next to the node, then move tail to the new node', 'Set head to the node and keep the old tail', 'Set node.next to head and move head', 'Traverse from head every time, even though tail is stored'], 0, 'Because tail points to the last node, a new node can be appended in O(1), then tail is updated.'),
    C('A list has one node. After removing the first node, what should head and tail be?', ['head is null but tail still points to the old node', 'Both head and tail are null', 'Both point to the next node', 'tail.next must point back to head'], 1, 'Removing the only node makes the list empty, so both references must be cleared.', 'Challenging'),
    C('What is the worst-case time for searching an unsorted singly linked list?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 2, 'The worst case checks every node, including when the target is absent.'),
    C('Which is a usual invariant of a non-circular singly linked list?', ['tail.next points to head', 'head.next is always null', 'tail.next is null', 'Every node has a previous pointer'], 2, 'A non-circular list ends at tail, whose next pointer is null.'),
    C('To remove a middle node from a singly linked list when its predecessor is known, what must change?', ['Set previous.next to skip the removed node', 'Set node.next to head', 'Always set tail.next to null', 'Copy every node into a new array'], 0, 'The predecessor must point to the successor of the node being removed.', 'Challenging'),
    T('Adding a node before head in a singly linked list takes O(1) when head is available.', 0, 'Set new.next to head, then move head to new.'),
    T('With only head, the kth node in a singly linked list can be accessed in O(1).', 1, 'The list must be traversed from the beginning, for up to k links.'),
    T('Appending to a linked list always takes O(1), even when the class stores only head.', 1, 'With only head, traversal to the last node takes O(n); appending is O(1) when tail is stored.', 'Challenging'),
    T('Removing the only node in a list must leave the list empty.', 0, 'Both head and tail must become null, and size must decrease.'),
    R('What is the list after appending 8?', 'Start: head -> 2 -> 5 -> null, tail points to 5\naddLast(8)', ['2 -> 5 -> 8', '8 -> 2 -> 5', '2 -> 8 -> 5', '5 -> 2 -> 8'], 0, 'Link the old tail to the new node, then move tail to 8.'),
    R('What value does head point to after removeFirst()?', 'head -> 4 -> 7 -> 9 -> null\nremoveFirst();', ['4', '7', '9', 'null'], 1, 'head moves to its old next node, which contains 7.'),
    R('What does this loop print?', 'head -> 3 -> 6 -> 2 -> null\nfor (Node p = head; p != null; p = p.next)\n  print(p.data);', ['362', '326', '632', '3'], 0, 'Start at head and follow p = p.next until null, printing 3, 6, and 2.'),
    R('The list is 3 -> 8 -> 1. What is the result of addFirst(5)?', 'newNode.next = head;\nhead = newNode;', ['3 -> 8 -> 1 -> 5', '5 -> 3 -> 8 -> 1', '5 -> 8 -> 1', 'head remains 3'], 1, 'The new node points to the old head, then head changes to 5.'),
    R('An empty list has size = 0. After addLast(11), how should head and tail be updated?', '// addLast on an empty list', ['head = newNode; tail = newNode;', 'head.next = newNode;', 'tail.next = newNode;', 'newNode.next = head;'], 0, 'With no existing nodes, the new node is both the first and the last.', 'Challenging'),
    F('Link a new node before the existing list.', 'newNode.next = ____;\nhead = newNode;', 'head', 'Preserve the reference to the existing list before moving head.'),
    F('Update tail after linking a new node at the end.', 'tail.next = newNode;\ntail = ____;', 'newNode', 'After the append, tail must refer to the last node.'),
    F('Fill in the traversal condition so it stops after passing the last node.', 'for (Node p = head; ____; p = p.next)', ['p != null', 'null != p'], 'The condition becomes false when p reaches null after tail.'),
    F('Update head after removing the first node.', 'head = ____;', 'head.next', 'The new head is the successor of the old head.'),
    F('If size starts at 1 and the only node is removed, set tail to ____.', 'head = null;\ntail = ____;', 'null', 'An empty list must have neither head nor tail.', 'Challenging')
  ]
});

window.DSA_TOPICS.push({
  id: 'linked-advanced', title: 'Circular/Doubly Lists and Big-O', icon: '⟳',
  description: 'Maintain links in both directions, handle circular traversal, and analyze growth.',
  questions: [
    C('In a circular singly linked list that stores tail, which node is the first node in the circle?', ['tail.next', 'tail', 'Always tail.next.next', 'null'], 0, 'tail.next is the head of the circle; there is no null terminator.'),
    C('In a one-node circular list, where should next point?', ['null', 'Back to the same node', 'To a different tail', 'To a nonexistent head'], 1, 'The single node must point to itself to preserve the circle.'),
    C('In a circular list that stores tail, how can you rotate so the old head becomes the tail?', ['tail = tail.next', 'tail = tail.next.next', 'tail.next = null', 'head = null'], 0, 'tail.next is the old head; moving tail there makes the next node the new head.', 'Challenging'),
    C('What direct benefit do prev and next provide in a doubly linked list?', ['O(1) search for any unsorted value', 'Backward traversal and convenient deletion of a node whose reference is known', 'Every insertion takes O(log n)', 'There is no need to store head'], 1, 'Two-way links support backward traversal and pointer updates around a node; searching may still take O(n).'),
    C('Why do some doubly linked lists use head and tail sentinels?', ['To keep elements automatically sorted', 'To reduce boundary cases, such as an empty list or insertion at the front', 'To use less memory than an SLL', 'To eliminate pointers'], 1, 'Sentinel nodes simplify link updates by making boundary operations more uniform.', 'Challenging'),
    C('A single loop runs n times and does constant work each time. What is its Big-O?', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 2, 'The number of primitive operations grows with n; Big-O omits constant factors.'),
    T('Prepending to a circular list that stores tail can be done in O(1) by updating tail.next.', 0, 'Set new.next to the old head, then set tail.next to new without traversal.'),
    T('In a doubly linked list, if p.next = q, then q.prev should point back to p.', 0, 'The prev and next links must agree so traversal works in both directions.'),
    T('Two nested loops that each run n times perform O(n²) work.', 0, 'The number of iteration pairs is n × n.'),
    T('The conventional simplification of 5n + 3 in Big-O notation is O(5n).', 1, 'Big-O drops constant factors, so the result is O(n).', 'Challenging'),
    R('A circle is A -> B -> C -> A, with tail at C. After tail = tail.next, what is the new head?', 'old tail = C\nold head = A', ['A', 'B', 'C', 'null'], 1, 'The new tail is A, and the new head is tail.next, which is B.', 'Challenging'),
    R('How many times does this loop call work() when n = 4?', 'for (int i = 0; i < n; i++)\n  for (int j = 0; j < n; j++) work();', ['4', '8', '12', '16'], 3, 'For each of 4 values of i, j runs 4 times: 4 × 4 = 16.'),
    R('The circle is 1 -> 2 -> 3 -> 1. Starting with p = head, how many values are printed before p returns to head?', 'do {\n  print(p.data);\n  p = p.next;\n} while (p != head);', ['2', '3', '4', 'The loop never ends'], 1, 'Traversal visits all three nodes before p returns to head, so it prints 3 values.'),
    R('In a DLL, q is between p and r. If p.next = r is set but r.prev = p is forgotten, what happens?', 'p <-> q <-> r\n// Remove q but update only one direction', ['Forward traversal immediately fails', 'Backward traversal from r still reaches the removed q', 'size increases', 'tail changes to p'], 1, 'The forward link changes, but r.prev still points to q, making the structure inconsistent.', 'Challenging'),
    R('What is the Big-O of this function?', 'for (int i = 1; i < n; i *= 2)\n  work();', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 1, 'i doubles each time, so the loop runs about log₂ n times.'),
    F('Link a new node as the head of a circular list that stores tail.', 'newNode.next = ____;\ntail.next = newNode;', 'tail.next', 'The old head is tail.next, so the new node must point to it.', 'Challenging'),
    F('Fill in the backward pointer to complete removal of q from the DLL.', 'p.next = q.next;\nq.next.prev = ____;', 'p', 'The successor of q must point back to q’s predecessor.'),
    F('Stop circular traversal before revisiting the first node.', 'while (____) {\n  p = p.next;\n}', 'p.next != start', 'Stop when the next node is the start, after processing the last node.'),
    F('What is the Big-O of one n-iteration loop followed by constant work?', 'T(n) = 7n + 20  =>  ____', 'O(n)', 'The linear term dominates growth, so the result is O(n).'),
    F('Fill in the outer loop bound so the nested loop performs n² iterations.', 'for (int i = 0; i < ____; i++)\n  for (int j = 0; j < n; j++) work();', 'n', 'Both loops run n times, producing n × n iterations.')
  ]
});

window.DSA_TOPICS.push({
  id: 'recursion', title: 'Recursion', icon: '↻',
  description: 'Identify base cases, trace the call stack, and count the work.',
  questions: [
    C('What is necessary for a recursive method to terminate?', ['A base case and recursive calls that move toward it', 'At least two recursive calls', 'A for loop inside the method', 'An int return type'], 0, 'The base case stops recursion, and each call must reduce the problem or approach the stopping condition.'),
    C('What is the correct base value for a recursive factorial method?', ['fact(0) = 0', 'fact(0) = 1', 'fact(1) = 0', 'fact(n) = n for every n'], 1, '0! = 1 is the base case, and fact(n) = n × fact(n-1).'),
    C('Why does naive Fibonacci take longer than ordinary linear recursion?', ['It uses an array', 'fib(n) calls both fib(n-1) and fib(n-2), causing repeated work', 'It has no base case', 'Every call takes O(n²)'], 1, 'The call tree branches and repeats subproblems, so the number of calls grows exponentially.', 'Challenging'),
    C('What is the minimum number of moves for the recursive Tower of Hanoi with n disks?', ['n²', '2n', '2ⁿ - 1', 'n!'], 2, 'The recurrence is T(n) = 2T(n-1) + 1, which gives 2ⁿ - 1 moves.', 'Challenging'),
    C('A recursive method makes one call per level until n and does constant work at each level. What is its complexity?', ['O(1)', 'O(log n)', 'O(n)', 'O(2ⁿ)'], 2, 'There are about n levels, and each level does constant work.'),
    C('Which statement correctly describes the stack of recursive calls?', ['The most recent call returns before older calls', 'The first call returns before the last call', 'All calls share the same local variables', 'Stack use does not grow with depth'], 0, 'The call stack is LIFO; after the base case returns, the deepest call unwinds first.', 'Challenging'),
    T('If a recursive call uses the same argument every time and has no stopping condition, recursion may never terminate.', 0, 'The problem does not get smaller and never reaches a base case, causing infinite recursion or stack overflow.'),
    T('Linear recursion with one call per level and depth n uses O(n) call-stack space.', 0, 'About n calls remain pending before returns begin.', 'Challenging'),
    T('The recursive computation fib(n) = fib(n-1) + fib(n-2) computes fib(3) only once when evaluating fib(5).', 1, 'Both fib(4) and fib(5) cause fib(3) to be computed again.', 'Challenging'),
    T('If a method prints n before a recursive call and decreases n to 1, the printed values are in descending order.', 0, 'Printing happens before descending deeper, so n, n-1, and so on appear before unwinding.'),
    R('What is the result of fact(4)?', 'int fact(int n) {\n  if (n == 0) return 1;\n  return n * fact(n - 1);\n}', ['10', '16', '24', '4'], 2, '4 × 3 × 2 × 1 × fact(0) = 24.'),
    R('What does the code print when f(3) is called?', 'void f(int n) {\n  if (n == 0) return;\n  print(n);\n  f(n - 1);\n  print(n);\n}', ['3 2 1 1 2 3', '1 2 3 3 2 1', '3 2 1', '1 2 3'], 0, 'Before recursive calls it prints 3, 2, 1; while unwinding it prints 1, 2, 3.', 'Challenging'),
    R('If F(0)=0, F(1)=1, and F(n)=F(n-1)+F(n-2), what is F(5)?', 'F(2), F(3), ...', ['3', '5', '8', '13'], 1, 'The sequence is 0, 1, 1, 2, 3, 5.'),
    R('What does sum(a, 3) return if sum adds a[0] through a[n-1]?', 'int[] a = {2, 4, 1};\nint sum(int[] a, int n) {\n  if (n == 0) return 0;\n  return sum(a, n - 1) + a[n - 1];\n}', ['5', '6', '7', '9'], 2, 'sum(a, 3) adds 2 + 4 + 1 = 7.'),
    R('What is the minimum number of moves for Tower of Hanoi with 3 disks?', 'T(n) = 2T(n - 1) + 1\nT(1) = 1', ['5', '6', '7', '8'], 2, 'T(2)=3 and T(3)=2×3+1=7.', 'Challenging'),
    F('Fill in the base case that makes factorial correct.', 'int fact(int n) {\n  if (n == ____) return 1;\n  return n * fact(n - 1);\n}', '0', 'When n decreases to zero, return 1 so the product remains unchanged.'),
    F('Fill in the argument that reduces the recursive problem by one.', 'return n + sum(____);', 'n - 1', 'n-1 makes the problem smaller and moves it toward the base case.'),
    F('Prevent Fibonacci recursion when n is 0 or 1.', 'if (____) return n;', ['n <= 1', 'n < 2', 'n == 0 || n == 1'], 'F(0) and F(1) are base values.', 'Challenging'),
    F('Fill in the recurrence for Tower of Hanoi moves when n is greater than 1.', 'T(n) = ____ + 1', ['2 * T(n - 1)', '2T(n-1)', '2 * t(n-1)'], 'Move n-1 disks aside, move the largest disk once, then move n-1 disks back.', 'Challenging'),
    F('To print values while the call stack unwinds, place print after the recursive call.', 'void f(int n) {\n  if (n == 0) return;\n  f(n - 1);\n  ____;\n}', ['print(n)', 'system.out.print(n)'], 'The statement after the call runs while recursion unwinds.')
  ]
});

window.DSA_QUESTIONS = window.DSA_TOPICS.flatMap(topic =>
  topic.questions.map((q, index) => window.DSA_BUILD_RECORD(topic, q, index))
);
window.DSA_TOPICS.push({
  id: 'stacks', title: 'Stacks', icon: '▤',
  description: 'Understand LIFO, the call stack, and expression conversion.',
  questions: [
    C('What is the defining rule of a stack?', ['FIFO: first in, first out', 'LIFO: last in, first out', 'Values are sorted from smallest to largest', 'Every position is accessed by index'], 1, 'A stack adds and removes items at the same end, so it is Last In, First Out.'),
    C('What is the difference between peek() and pop()?', ['Both remove the top item', 'peek reads the top without removing it, while pop removes it', 'peek adds an item while pop reads one', 'pop works only on an empty stack'], 1, 'peek does not change the state; pop decreases the stack size.'),
    C('An array-backed stack uses size as the next empty position. What is the top index when the stack is nonempty?', ['size', 'size - 1', 'size + 1', 'capacity - 1'], 1, 'The top item is in the slot immediately before the next empty position.'),
    C('A dynamic array-backed stack is full before a new push. What is the usual approach?', ['Discard the oldest item', 'Grow the array and copy the existing items', 'Shift every item left and overwrite one', 'Change to FIFO'], 1, 'Growing and copying makes push O(1) amortized for most operations.'),
    C('Why is a stack useful for checking nested opening and closing brackets?', ['The first pair must always be matched first', 'The most recent unmatched opener must be closed first', 'Brackets must be sorted by ASCII value', 'A stack searches every position in O(1)'], 1, 'Nested matching follows the LIFO order.'),
    C('When converting infix to postfix with a stack, what is primarily stored on the stack?', ['Operands are pushed every time', 'Operators wait until precedence and parentheses allow them to be output', 'Numbers are sorted from smallest to largest', 'Parentheses are ignored'], 1, 'The stack holds operators that cannot yet be output, while handling precedence and parentheses.'),
    T('Calling pop() on an empty stack should return a top element normally.', 1, 'There is no item to return; the implementation should report underflow or follow a defined empty-result policy.'),
    T('After push(A), push(B), pop(), B is removed before A.', 0, 'B was added later, so it is on top and is removed first.'),
    T('peek() should change the size of a stack.', 1, 'peek reads without removing an item, so the size stays the same.'),
    T('The postfix expression 8 3 - evaluates to 5.', 0, 'Subtraction uses the operands in order: 8 - 3 = 5.'),
    R('What value does peek() return after these operations?', 'push(4);\npush(7);\npop();\npeek();', ['4', '7', '11', 'Nothing'], 0, 'pop removes 7, leaving 4 as the top item.'),
    R('Is the bracket string ([{}]) balanced by bracket type?', '([{}])', ['Balanced', 'Unbalanced because there are different counts of openers and closers', 'Unbalanced because the square bracket closes before the brace', 'Unbalanced because the stack must be empty from the start'], 0, 'Each closer matches the most recent opener, and the stack is empty at the end.'),
    R('Is the bracket string ([)] balanced by bracket type?', '([)]', ['Balanced because there are two openers and two closers', 'Unbalanced because ) does not match the top square bracket', 'Balanced if square brackets are ignored', 'Unbalanced only if braces appear'], 1, 'When ) is read, the top opener is [, so the types do not match even though the counts are equal.'),
    R('What is the value of this postfix expression?', '5 2 + 3 *', ['11', '21', '25', '35'], 1, 'Compute 5+2 = 7, then 7×3 = 21.'),
    R('What is the stack from bottom to top after all operations?', 'push(A); push(B); pop(); push(C);', ['A, B, C', 'A, C', 'C, A', 'B, C'], 1, 'pop removes B, leaving A; then C is pushed on top.'),
    F('Fill in the index used to read the top item when size is the number of elements.', 'return data[____];', 'size - 1', 'The top item is immediately before the next empty slot.'),
    F('Prevent pop from an empty stack.', 'if (____) throw new EmptyStackException();', 'size == 0', 'A size of zero means there is no item to remove.'),
    F('Decrease size before reading the item being popped.', 'int value = data[____];', '--size', 'When size is the element count, the old top is data[--size].'),
    F('After reading a closing bracket, an empty stack means there is no matching opener.', 'if (____) return false;', 'stack.isEmpty()', 'A closing bracket with no earlier opener is a mismatch.'),
    F('Fill in the postfix form of (3 + 4) * 2.', 'Postfix: ____', '3 4 + 2 *', 'Parentheses add 3 and 4 first, then multiply the result by 2.')
  ]
});

window.DSA_TOPICS.push({
  id: 'queues', title: 'Queues', icon: '⇥',
  description: 'Trace front and rear pointers and understand circular-array wraparound.',
  questions: [
    C('What is the defining rule of a queue?', ['LIFO', 'FIFO', 'Always sorted by priority', 'Items can only be added and removed in the middle'], 1, 'The item that arrives first is removed first.'),
    C('In a circular-array queue, how should front move after removing its current item?', ['front = front - 1', 'front = (front + 1) % capacity', 'front = rear', 'front = size'], 1, 'Modulo wraps the index from the end of the array back to its beginning.'),
    C('Why is a circular queue better than shifting every item after each dequeue?', ['It does not need to store items', 'It reuses free slots at the front without shifting all elements', 'Dequeue becomes O(log n)', 'It changes the queue to LIFO'], 1, 'Rotating front and rear reuses the array and avoids O(n) shifting.'),
    C('A circular queue has capacity 8 and rear is at index 7. What is the next index?', ['8', '0', '7', '1'], 1, '(7 + 1) % 8 = 0.'),
    C('Which structure models passengers who should be served in arrival order?', ['Stack', 'Queue', 'Binary search tree', 'Hash table'], 1, 'The service order is FIFO, so use a queue.'),
    C('If front, rear, and size are tracked separately, how can empty and full be distinguished?', ['front == rear always means both', 'size == 0 means empty and size == capacity means full', 'rear == 0 means empty', 'front == capacity means full'], 1, 'size distinguishes states that may have the same indexes in a circular array.'),
    T('dequeue() removes the most recently added item first.', 1, 'A queue is FIFO, so it removes the earliest item first.'),
    T('In a nonempty circular-array queue, front may have a larger index than rear.', 0, 'After wraparound, rear may return to the beginning while front remains near the end.'),
    T('On an empty queue, peek() can read an item without checking any condition.', 1, 'The empty case needs a policy, such as throwing an exception or returning a defined result.'),
    T('Using rear = (rear + 1) % capacity makes rear wrap to 0 at the end of the array.', 0, 'When rear is capacity-1, modulo produces zero.'),
    R('A queue starts as [A, B, C] with front at A. What does peek() return after dequeue()?', 'dequeue();\npeek();', ['A', 'B', 'C', 'The queue is empty'], 1, 'dequeue removes A and moves front to B.'),
    R('capacity = 5, front = 4, and there are 2 items. What is front after dequeue?', '(front + 1) % capacity', ['0', '1', '3', '4'], 0, '(4 + 1) % 5 = 0.'),
    R('capacity = 6 and rear = 5. What is the new rear after one enqueue?', '(rear + 1) % capacity', ['0', '1', '5', '6'], 0, '(5 + 1) % 6 = 0.'),
    R('Start with an empty queue, then enqueue(A), enqueue(B), dequeue(), enqueue(C). What is the order from front?', 'capacity is greater than 2', ['A, B, C', 'B, C', 'C, B', 'A, C'], 1, 'A is removed, B remains, then C is added at the rear.'),
    R('What should happen when dequeuing the last item from a queue that tracks size?', 'Before dequeue: size = 1', ['size = 0 and the queue is empty', 'size = 1 and front points to null', 'size = capacity', 'front and rear must always point to index 0'], 0, 'Decreasing size from one to zero makes the queue empty; index normalization depends on the implementation.'),
    F('Fill in the formula for advancing front in a circular-array queue.', 'front = (front + 1) ____ capacity;', '%', 'Modulo wraps the index after it passes the last slot.'),
    F('Fill in the formula for advancing rear after enqueue.', 'rear = (rear + 1) ____ capacity;', '%', 'rear must wrap within indexes 0 through capacity - 1.'),
    F('Check whether a queue that tracks size is empty.', 'boolean isEmpty() { return ____; }', 'size == 0', 'A size of zero means there are no items.'),
    F('Increase the item count after a successful enqueue.', 'data[rear] = element;\nsize ____;', '++', 'After storing a new item, the number of items increases by one.'),
    F('Read the item at the front during array-based dequeue.', 'int answer = data[____];', 'front', 'dequeue returns the item at front before advancing front.')
  ]
});

window.DSA_TOPICS.push({
  id: 'hashing', title: 'Hash Tables', icon: '#',
  description: 'Map keys to indexes, handle collisions, and analyze performance.',
  questions: [
    C('What is the main role of a hash function in a hash table?', ['Sort keys from smallest to largest', 'Map a key to a hash code used to calculate its storage position', 'Eliminate collisions without any other strategy', 'Compress all keys into unique values'], 1, 'A hash code helps choose a starting position, but different keys may still collide.'),
    C('If the table capacity is m and the hash code is an integer, which is a common index calculation?', ['hashCode * m', 'hashCode % m', 'hashCode + m', 'm / hashCode'], 1, 'Modulo compression maps a value into the table index range.'),
    C('Which statement correctly describes a collision?', ['It occurs only when two keys are equal', 'Different keys map to the same index', 'The table has no empty slots', 'A hash code must be negative'], 1, 'Collisions can occur for unequal keys because the number of positions is limited.'),
    C('How does linear probing handle a collision?', ['Store every key in one linked list at the same index', 'Check subsequent slots in order until an empty slot is found', 'Resize the table after every collision', 'Discard the new key'], 1, 'Linear probing checks the next index and wraps around at the end of the table.'),
    C('How does separate chaining store keys that collide?', ['Store all colliding keys in the bucket/list at the same index', 'Move all keys to index 0', 'Change the hash function each time', 'Discard colliding keys'], 0, 'Each bucket stores a collection of entries mapped to that index.'),
    C('What can happen when the load factor is very high in open addressing?', ['Probe sequences grow longer and operations slow down', 'Collisions disappear', 'The table always uses less memory', 'The hash function is guaranteed to be O(1)'], 0, 'With fewer empty slots, more positions may need to be probed.'),
    T('Keys that are equal according to equality must have equal hash codes for a hash table to work correctly.', 0, 'The hash contract requires equal objects to have equal hash codes.'),
    T('A good hash function guarantees that no collisions occur.', 1, 'There are usually more possible keys than slots, so collisions are possible; a good function only distributes keys well.'),
    T('Deleting a linear-probing entry by immediately marking its slot empty can make later entries unreachable during search.', 0, 'Search may stop at an empty slot, so use a tombstone or repair the probe cluster.'),
    T('Separate chaining can store multiple keys that map to the same index.', 0, 'Each bucket has a list or collection for colliding entries.'),
    R('A table of size 5 uses index = key % 5. At which index does key 12 start its search?', 'h(k) = k % 5', ['0', '1', '2', '3'], 2, '12 % 5 = 2.'),
    R('With linear probing, slots 2 and 3 contain 12 and 18, and slot 4 is empty. Where is key 23 inserted if it starts at 2?', 'table size = 5; h(23) = 2', ['2', '3', '4', '0'], 2, 'Slot 2 collides, slot 3 collides, and slot 4 is empty, so insert at 4.'),
    R('A size-7 table starts probing at index 6; slots 6 and 0 are used. Which next empty slot is checked?', 'indices wrap modulo 7', ['1', '2', '5', '6'], 0, 'From 6, probing wraps to 0; the next slot is 1.'),
    R('If a hash function distributes keys well and the load factor is low, what is the average search time?', 'Expected time', ['O(1) on average', 'Always O(log n)', 'O(n²)', 'O(n log n)'], 0, 'With suitable distribution and a controlled load factor, the average bucket or probe count is constant.'),
    R('A hash code may be negative. Why does Math.abs(hash) % m have an edge case?', 'In Java, abs of the minimum negative value can remain negative', ['abs always produces zero', 'The minimum negative value may remain negative after abs', 'Modulo cannot be used with int', 'There is no edge case'], 1, 'The signed integer minimum has no positive counterpart of the same type; use floorMod or handle it correctly.'),
    F('Fill in the index-compression operation when m is the table capacity.', 'int index = hashCode ____ m;', '%', 'Modulo restricts the position to the table range.'),
    F('After the initial slot collides, check the next index in linear probing.', 'index = (index + 1) ____ capacity;', '%', 'Modulo wraps the probe back to the start of the table.'),
    F('Fill in the load factor for n entries in a table with m slots.', 'loadFactor = ____;', 'n / (double) m', 'The load factor is the number of entries divided by capacity.'),
    F('If keyA.equals(keyB) is true, what relation is required by the hash contract?', 'keyA.hashCode() ____ keyB.hashCode()', '==', 'Equal objects must have equal hash codes.'),
    F('If hashCode may be negative, which Java method ensures a nonnegative modulo index?', 'index = Math.____(hashCode, capacity);', 'floorMod', 'Math.floorMod handles the remainder correctly for a positive divisor.')
  ]
});
window.DSA_TOPICS.push({
  id: 'search-sort', title: 'Searching and Sorting', icon: '↕',
  description: 'Choose search methods, trace sorting passes, and compare time and space.',
  questions: [
    C('What key property must the data have for binary search to work correctly?', ['The data is sorted according to the comparison order', 'The data has no duplicate values', 'The number of elements is even', 'The data is stored only in a linked list'], 0, 'Discarding half of the range works because sorted order tells us which direction to search.'),
    C('What is the worst-case time of linear search on n values?', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 2, 'Every value may need to be checked when the target is last or absent.'),
    C('What is an advantage of insertion sort on a small, nearly sorted array?', ['It often performs well when there are few inversions', 'Its worst case is O(log n)', 'It requires no element comparisons', 'It works only with an even number of values'], 0, 'Each value is inserted into the sorted prefix, so nearly sorted data needs little work.'),
    C('What does array-based merge sort generally trade for O(n log n) time?', ['O(n) temporary space during merging', 'An increase to O(n²) time', 'The need to split the data', 'A change in the data type'], 0, 'Merging two sorted ranges commonly uses a temporary array.'),
    C('When can quicksort have O(n²) worst-case time?', ['Repeated partitions leave one side nearly empty', 'Every partition splits exactly in half', 'It uses an array of size n', 'Recursion depth never exceeds log n'], 0, 'Highly unbalanced partitions can make the recurrence accumulate quadratic work.', 'Challenging'),
    C('What does stable sorting mean?', ['Items with equal keys keep their original relative order', 'The result is always sorted in ascending order', 'No extra memory is used', 'Every case runs in O(n)'], 0, 'Stability preserves the original order of items with equal keys.'),
    T('Binary search works correctly on an unsorted array without any algorithm changes.', 1, 'Halving the range depends on sorted data.'),
    T('Bubble sort that swaps only when a[j] > a[j+1] preserves the relative order of equal values.', 0, 'Equal values are never swapped past each other, so the sort is stable.'),
    T('Basic selection sort has O(n²) worst-case time.', 0, 'Each pass searches the remaining range for its minimum.'),
    T('Standard merge sort using a temporary array is an in-place sort.', 1, 'It uses extra space proportional to the data size, so the standard version is not in-place.'),
    R('What is the array after the first left-to-right bubble-sort pass?', 'int[] a = {4, 1, 3};\nfor (int j = 0; j < a.length - 1; j++)\n  if (a[j] > a[j + 1]) swap(a, j, j + 1);', ['{1, 3, 4}', '{1, 4, 3}', '{3, 1, 4}', '{4, 1, 3}'], 0, 'Swap 4 and 1 to get {1,4,3}; then swap 4 and 3 to get {1,3,4}.', 'Challenging'),
    R('Which index is checked first as the middle by binary search?', 'data = {2, 5, 8, 12, 16, 23, 38};\nlow = 0; high = 6;\nmid = (low + high) / 2;', ['2', '3', '4', '5'], 1, '(0 + 6) / 2 = 3 using integer division.'),
    R('Continuing the previous question, if searching for 16 and mid = 3 contains 12, what range is next?', 'low = 0; high = 6; mid = 3;', ['low = 0, high = 2', 'low = 4, high = 6', 'low = 3, high = 6', 'Stop and report not found'], 1, '16 is greater than 12, so discard the left half including mid and search indexes 4 through 6.'),
    R('What is the array after the first selection-sort pass?', 'int[] a = {7, 4, 6, 2};\n// Find the minimum in the full range and swap it with index 0', ['{2, 4, 6, 7}', '{4, 2, 6, 7}', '{2, 7, 6, 4}', '{7, 4, 6, 2}'], 0, 'The minimum value 2 is swapped into index 0; the remaining values stay 4, 6, 7.', 'Challenging'),
    R('What is the result of merging the sorted ranges [1, 6] and [2, 5]?', 'compare front values and copy the smaller', ['[1, 6, 2, 5]', '[1, 2, 5, 6]', '[2, 1, 6, 5]', '[1, 2, 6, 5]'], 1, 'Compare 1 with 2, then 6 with 2 and 5, before copying the remaining 6.'),
    R('With an inclusive interval, when does binary search stop if the value is absent?', 'while (low <= high) { ... }', ['low == high', 'low > high', 'low < 0', 'mid == 0'], 1, 'The interval is empty when low becomes greater than high.'),
    F('Fill in the midpoint calculation that reduces the risk of integer overflow.', 'int mid = low + (____) / 2;', 'high - low', 'This is equivalent to (low + high)/2 but avoids adding two very large values.'),
    F('In insertion sort, shift values larger than key to the right.', 'while (j >= 0 && data[j] ____ key) {', '>', 'A value greater than key must move right to open the insertion position.'),
    F('In inclusive binary search, set the right-side range after the target is greater than data[mid].', 'low = mid ____ 1;', '+', 'Discard the checked mid position and start at the next index.'),
    F('Fill in the operator that makes bubble sort swap only out-of-order ascending pairs.', 'if (a[j] ____ a[j + 1]) swap(a, j, j + 1);', '>', 'Swap when the left element is greater than the right element.'),
  ]
});

window.DSA_TOPICS.push({
  id: 'trees', title: 'Trees and BST', icon: '⌘',
  description: 'Understand parent/child relationships, BST rules, and traversals.',
  questions: [
    C('What is a node with no children in a tree called?', ['root', 'leaf', 'ancestor', 'edge'], 1, 'A leaf is a node with no children.'),
    C('In a BST with no duplicates and the rule left < node < right, where does a value smaller than a node belong?', ['The left subtree', 'The right subtree', 'Anywhere', 'At the root'], 0, 'The BST invariant places smaller values on the left and larger values on the right.'),
    C('In what order does preorder traversal visit nodes?', ['Left, node, right', 'Node, left, right', 'Left, right, node', 'Every level from left to right'], 1, 'Preorder visits the root first, then the left and right subtrees.'),
    C('What does inorder traversal produce on a BST with the rule left < node < right?', ['Values in ascending order', 'Always descending order', 'Level order', 'Insertion order only'], 0, 'Inorder is left, node, right, so values are read in sorted order.'),
    C('If a BST becomes a chain after inserting already sorted values, what is worst-case search time?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 2, 'The height may be n, requiring a node-by-node traversal.', 'Challenging'),
    C('In a zero-based array representation of a binary tree, where is the left child of index i?', ['2i', '2i + 1', '2i + 2', 'i + 1'], 1, 'The zero-based formulas are left = 2i+1 and right = 2i+2.'),
    T('The root of a tree has depth 0 when depth counts edges from the root.', 0, 'There are no edges from the root to itself.'),
    T('Postorder traversal visits the root before either subtree.', 1, 'Postorder visits left, right, and then the node.'),
    T('Breadth-first traversal uses a queue to process nodes level by level.', 0, 'A queue preserves the order in which nodes at each level are discovered.'),
    T('A balanced BST has height about log n and search time O(log n).', 0, 'Each level of a balanced tree substantially reduces the remaining search region.'),
    R('What is the preorder traversal of this tree?', '    A\n   / \\\n  B   C\n / \\\nD   E', ['A, B, D, E, C', 'D, B, E, A, C', 'D, E, B, C, A', 'A, B, C, D, E'], 0, 'Visit A first, then subtree B (B, D, E), and then C.'),
    R('What is the inorder traversal of this binary tree?', '    A\n   / \\\n  B   C\n / \\\nD   E', ['A, B, D, E, C', 'D, B, E, A, C', 'D, E, B, C, A', 'A, B, C, D, E'], 1, 'Inorder visits the left side first: D, B, E, then A and C.'),
    R('What is the postorder traversal of this tree?', '    A\n   / \\\n  B   C\n / \\\nD   E', ['A, B, D, E, C', 'D, B, E, A, C', 'D, E, B, C, A', 'A, B, C, D, E'], 2, 'Postorder visits the left subtree, the right subtree, and then the node.'),
    R('What is the breadth-first order of this tree?', '    A\n   / \\\n  B   C\n / \\\nD   E', ['A, B, C, D, E', 'A, B, D, E, C', 'D, B, E, A, C', 'D, E, B, C, A'], 0, 'BFS uses a queue and visits upper levels first: A, B, C, then D, E.'),
    R('Starting with an empty BST, insert 8, 3, 10, 1, 6. What is the parent of 6?', 'insert in the given order', ['8', '3', '10', '1'], 1, '6 is less than 8, so go to 3; 6 is greater than 3, so it becomes the right child of 3.'),
    F('Fill in the inorder traversal order for the current node p.', 'inorder(p.left); visit(p); inorder(p.right);  =>  ____, node, ____', ['left, right', 'left, right'], 'Inorder visits the left subtree, then the node, then the right subtree.'),
    F('Fill in the right-child index in a zero-based array representation.', 'rightIndex = ____;', '2 * i + 2', 'The zero-based right-child formula is 2i + 2.'),
    F('Stop recursive preorder when the node does not exist.', 'void preorder(Node p) {\n  if (____) return;', 'p == null', 'A null pointer represents an empty subtree.'),
    F('Fill in the BST branch for an inserted value smaller than the current node.', 'if (value < p.data) p = p.____;', 'left', 'Smaller values are searched for or inserted in the left subtree.'),
    F('What is the maximum number of nodes in a binary tree of height h edges?', 'maximum nodes = ____', '2^(h + 1) - 1', 'When every level is full, the count is 1 + 2 + ... + 2^h.')
  ]
});

window.DSA_TOPICS.push({
  id: 'graphs', title: 'Graphs', icon: '◈',
  description: 'Understand vertices, edges, graph representations, BFS/DFS, and path types.',
  questions: [
    C('In a graph G = (V, E), what do V and E represent?', ['V is the set of vertices and E is the set of edges', 'V is values and E is errors', 'V is vertices and E is only time-based events', 'V is edges and E is vertices'], 0, 'V is the set of vertices, and E is the set of edges.'),
    C('What is the maximum number of edges in a simple undirected graph with n vertices?', ['n²', 'n(n-1)/2', 'n(n+1)', '2n'], 1, 'Choose any pair of distinct vertices: there are n choose 2 pairs.'),
    C('In an undirected graph, what is the degree of a vertex?', ['The total number of vertices', 'The number of edges incident to that vertex', 'The number of cycles in the graph', 'The number of paths starting at the root'], 1, 'Degree counts incident edges; a self-loop is handled according to the given convention.'),
    C('Why does an adjacency matrix use O(V²) space even when a graph has few edges?', ['It stores a slot for every pair of vertices', 'It stores only existing edges', 'It sorts vertices each time', 'Each edge is stored twice in a list'], 0, 'The matrix has rows and columns for all vertices.'),
    C('Which structure does BFS use to visit vertices by distance levels?', ['Stack', 'Queue', 'Heap sort', 'Hash function'], 1, 'A queue expands the vertex discovered earliest first.'),
    C('What mechanism does DFS commonly use to continue deeper?', ['A queue or recursion/stack', 'Only a sorted array', 'Only a hash table', 'Only a symmetric adjacency matrix'], 0, 'DFS stores unfinished paths using a stack or the call stack.'),
    T('The adjacency matrix of an undirected graph is symmetric when stored correctly.', 0, 'If u is connected to v, then v is connected to u.'),
    T('An Euler path is about visiting every vertex at least once, while a Hamiltonian path is about using every edge.', 1, 'An Euler path uses every edge once; a Hamiltonian path visits every vertex once.'),
    T('A connected graph has a path between every pair of vertices.', 0, 'This is the definition of a connected graph.'),
    T('BFS on an unweighted graph can find a path using the fewest edges from the start vertex.', 0, 'BFS visits vertices by increasing number of edges from the source.'),
    R('How many edges does a complete undirected graph with 6 vertices have?', '|E| = n(n - 1) / 2', ['12', '15', '30', '36'], 1, '6×5/2 = 15.'),
    R('What is the degree of B in a graph with edges AB, BC, BD, and CD?', 'undirected graph', ['1', '2', '3', '4'], 2, 'AB, BC, and BD are incident to B, for a total of 3 edges.'),
    R('BFS starts at A; neighbors are processed alphabetically, and edges are AB, AC, BD, CE. What is the visit order?', 'visit each vertex once', ['A, B, C, D, E', 'A, C, E, B, D', 'A, B, D, C, E', 'A, E, C, B, D'], 0, 'Start at A and enqueue B,C; expanding B discovers D, and expanding C discovers E.'),
    R('For the same graph, DFS starts at A and processes neighbors alphabetically. What is the preorder?', 'edges: AB, AC, BD, CE', ['A, B, D, C, E', 'A, B, C, D, E', 'A, C, E, B, D', 'A, E, C, B, D'], 0, 'DFS follows B to D first, then backtracks to C and visits E.'),
    R('In a directed graph, there is an edge A -> B but no edge B -> A. Which statement is correct?', 'directed edge', ['A’s undirected degree increases by one in the same way as in an undirected graph', 'A has an outgoing edge to B, but B has no incoming edge from A', 'Treat B -> A as present too', 'The graph must be complete'], 1, 'Direction matters: A has an outgoing edge and B has an incoming edge.'),
    F('Fill in the dimensions of an adjacency matrix for V vertices.', 'matrix dimensions = ____', 'V x V', 'There is one row and one column per vertex.'),
    F('Fill in the maximum number of edges in a simple undirected graph.', 'max edges = ____', 'n * (n - 1) / 2', 'Each edge is a unique pair of vertices.'),
    F('In BFS, add a discovered vertex to a ____ for processing in order.', '____.add(neighbor);', 'queue', 'BFS uses a FIFO queue.'),
    F('Before adding a neighbor to the BFS queue, check that the vertex has not been ____.', 'if (!____[v]) { ____[v] = true; ... }', 'visited', 'Marking prevents revisiting and enqueuing the same vertex more than once.'),
    F('Complete the distinction: an Euler path uses every edge; a Hamiltonian path visits every ____.', 'Hamiltonian path visits each ____ exactly once', 'vertex', 'Hamiltonian paths concern vertices, not using every edge.')
  ]
});

window.DSA_QUESTIONS = window.DSA_TOPICS.flatMap(topic =>
  topic.questions.map((q, index) => window.DSA_BUILD_RECORD(topic, q, index))
);
