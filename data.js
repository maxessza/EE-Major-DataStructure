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
      'collision เกิดได้เฉพาะเมื่อ key สองตัวเท่ากันตาม equals',
      'hash function ที่ดีรับประกันว่าจะไม่มี collision ใน table',
      'ใน linear probing ลบ entry แล้วล้างช่องเป็น empty ได้เสมอโดยไม่กระทบการค้นหาถัดไป'
    ] },
    { re: /tree|\bBST\b|root|leaf|traversal|subtree|parent|child|duplicate.*(?:right|ขวา)|ลงขวา/i, items: [
      'inorder traversal ให้ผลเรียงจากน้อยไปมากสำหรับ binary tree ทุกต้น',
      'BST จะสมดุลโดยอัตโนมัติไม่ว่าจะแทรกข้อมูลเรียงลำดับแบบใด',
      'search ใน BST ใช้ O(log n) เสมอ แม้ tree จะเอียงเป็น chain'
    ] },
    { re: /graph|\bvertex\b|\bvertices\b|\bBFS\b|\bDFS\b|adjacency|Euler|Hamiltonian|directed graph|undirected graph/i, items: [
      'BFS รับประกันเส้นทางน้ำหนักรวมน้อยที่สุดแม้ edge มีน้ำหนักต่างกัน',
      'ใน directed graph มี edge u → v แล้วเดินกลับ v → u ได้เสมอ',
      'Euler path เยี่ยมทุก vertex ครั้งเดียว ส่วน Hamiltonian path ใช้ทุก edge ครั้งเดียว'
    ] },
    { re: /queue|fifo|enqueue|dequeue|front|rear|wrap-around|คิว/i, items: [
      'Queue เป็น LIFO จึงนำสมาชิกที่ enqueue ล่าสุดออกก่อน',
      'enqueue มาตรฐานเพิ่มสมาชิกที่ front และ dequeue จาก rear',
      'การเลื่อน index ใน circular queue ไม่ต้อง wrap กลับเมื่อถึง capacity'
    ] },
    { re: /postfix|infix|bracket|push|pop|peek|lifo|บนสุด|วงเล็บ/i, items: [
      'Stack เป็น FIFO จึงนำสมาชิกที่ push ก่อนออกก่อน',
      'peek() นำสมาชิกบนสุดออกและลด size เหมือน pop()',
      'การคำนวณ a - b จาก postfix สามารถสลับเป็น b - a ได้'
    ] },
    { re: /recursive|recursion|base case|call stack|fib|hanoi|factorial|sum\(/i, items: [
      'ทุก recursive call ใช้ local variables ชุดเดียวกันร่วมกัน',
      'การเรียกซ้ำจะหยุดเองเมื่อ stack มี call มากพอ แม้ไม่มี base case',
      'Fibonacci แบบเรียก F(n-1) และ F(n-2) คำนวณแต่ละค่าเพียงครั้งเดียว'
    ] },
    { re: /binary search|linear search|sort|sorted|insertion|selection|bubble|merge|pivot|stable|เรียง/i, items: [
      'binary search ตัดช่วงครึ่งได้ถูกต้องแม้ข้อมูลยังไม่เรียง',
      'selection sort แบบพื้นฐานหยุดได้ทันทีใน best case เมื่อข้อมูลเรียงแล้ว',
      'stable sort หมายถึงสมาชิกที่มี key เท่ากันถูกเรียงใหม่ได้ทุกลำดับ'
    ] },
    { re: /circular|doubly|\bDLL\b|sentinel|วงกลม/i, items: [
      'การมี prev ทำให้ค้นหา node ใดก็ได้ใน O(1) แม้ไม่มี reference ถึง node นั้น',
      'node ท้ายของ circular list ต้องมี next เป็น null เพื่อจบ traversal',
      'เมื่อเขียน Big-O ในรูปแบบลดรูปของ 7n + 20 ต้องเก็บ coefficient 7 ไว้ จึงเป็น O(7n)'
    ] },
    { re: /array|อาร์เรย์|index|reference/i, items: [
      'การกำหนด b = a จะคัดลอกสมาชิกทุกช่องเป็นคนละ array โดยอัตโนมัติ',
      'array เพิ่มหรือลด length ได้เมื่อเขียนเกินช่องสุดท้าย',
      'index สุดท้ายของ array เท่ากับ length จึงใช้ i <= length วนได้ครบ'
    ] },
    { re: /linked.?list|singly linked|\bSLL\b|head|tail|node|ลิงก์|ลิสต์/i, items: [
      'การเข้าถึง node ลำดับที่ k ทำได้ O(1) เพราะทุก node มี index',
      'Singly linked list เดินย้อนจาก tail ได้ทันทีโดยไม่ต้องมี prev',
      'ถ้าเก็บเพียง head การเพิ่มท้ายยังเป็น O(1) โดยไม่ต้องเดินหา tail'
    ] },
    { re: /big-o|complexity|\bO\s*\(|nested loops|ลูปซ้อน|ลูป|เวลา/i, items: [
      'nested loops คูณจำนวนรอบ แต่ sequential loops บวกจำนวนรอบ',
      'Big-O ต้องเก็บ coefficient ของพจน์เด่นไว้เสมอ เช่น O(7n)',
      'ลูปที่เพิ่มตัวแปรเป็นสองเท่าทำงาน O(n) เพราะมีการเพิ่มค่าหลายครั้ง'
    ] }
  ];
  var context = prompt + ' ' + explanation;
  var bank = banks.find(function (item) { return item.re.test(prompt); }) ||
    banks.find(function (item) { return item.re.test(context); }) || {
    items: [
      'คำตอบขึ้นกับจำนวนข้อมูลที่เก็บ แต่ไม่ขึ้นกับลำดับการทำงานหรือ representation',
      'กรณีขอบไม่เปลี่ยนผลลัพธ์ จึงไม่จำเป็นต้องตรวจ invariant ของโครงสร้าง',
      'ทุก implementation ของโครงสร้างนี้มี complexity และพฤติกรรมเหมือนกันเสมอ'
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
    'กรณีขอบไม่เปลี่ยนผลลัพธ์ จึงไม่จำเป็นต้องตรวจ invariant ของโครงสร้าง',
    'ทุก implementation ของโครงสร้างนี้มี complexity และพฤติกรรมเหมือนกันเสมอ'
  ];
  for (var j = 0; choices.length < 4 && j < fallback.length; j++) add(fallback[j]);
  return ['logic', 'พิจารณาข้อความ: “' + prompt + '”\nเลือกคำอธิบายที่ถูกต้องที่สุด', '', choices.slice(0, 4),
    choices.indexOf(explanation), explanation, difficulty || 'ท้าทาย'];
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
  return ['fill', prompt, code, options, options.indexOf(answer), explanation, difficulty || 'ท้าทาย'];
};
const C = (p, o, a, e, d = 'กลาง') => ['concept', p, '', o, a, e, d];
const T = (p, a, e, d = 'กลาง') => window.DSA_BUILD_ASSERTION(p, a === 1, e, d);
const R = (p, code, o, a, e, d = 'กลาง') => ['trace', p, code, o, a, e, d];
const F = (p, code, a, e, d = 'กลาง') => window.DSA_BUILD_FILL(p, code, a, e, d);

window.DSA_TOPICS.push({
  id: 'arrays', title: 'พื้นฐานและ Arrays', icon: '▦',
  description: 'เลือกโครงสร้างให้เหมาะ อ่าน index และไล่ลูปอย่างระวัง',
  questions: [
    C('เหตุใดคลาสที่เก็บข้อมูลภายในมักกำหนด field เป็น private แล้วเปิดเมธอดให้ใช้งาน?', ['เพื่อซ่อนรายละเอียดและคุมไม่ให้ข้อมูลผิด invariant', 'เพื่อทำให้ทุกเมธอดทำงานเป็น O(1)', 'เพราะ Java ห้าม field เป็น public', 'เพื่อให้ object ใช้หน่วยความจำน้อยลง'], 0, 'การควบคุมการเข้าถึงช่วยรักษาสถานะที่ถูกต้อง เช่น size ต้องไม่ติดลบ'),
    C('หากต้องอ่านสมาชิกตำแหน่งใดก็ได้บ่อย ๆ และจำนวนสมาชิกแทบไม่เปลี่ยน โครงสร้างใดเหมาะกว่า?', ['Singly linked list', 'Array', 'Stack', 'Queue'], 1, 'Array เข้าถึงด้วย index ได้ O(1); linked list ต้องเดินจาก node ต้นทาง'),
    C('อาร์เรย์ยาว 8 ตำแหน่ง มี index ที่ใช้ได้ตั้งแต่เท่าไรถึงเท่าไร?', ['1 ถึง 8', '0 ถึง 8', '0 ถึง 7', '1 ถึง 7'], 2, 'Java เริ่ม index ที่ 0 ดังนั้นตำแหน่งสุดท้ายคือ length - 1'),
    C('ถ้า int[][] grid มี 4 แถว และแต่ละแถวมี 3 ช่อง grid.length ให้ค่าใด?', ['3', '4', '7', '12'], 1, 'length ของ array ชั้นนอกคือจำนวนแถว ส่วน grid[0].length คือจำนวนช่องในแถวแรก'),
    C('ต้องการสำเนา array ที่แก้ไขแล้วไม่กระทบ array เดิม วิธีใดถูกต้อง?', ['int[] b = a;', 'สร้าง int[] ใหม่แล้วคัดลอกค่าทีละช่อง', 'int[] b = {a.length};', 'int[] b = null;'], 1, 'b = a ทำให้สองตัวแปรอ้าง array ก้อนเดียวกัน ต้องสร้างก้อนใหม่และคัดลอกสมาชิก', 'ท้าทาย'),
    C('การเปรียบเทียบ a == b สำหรับ array ใน Java ตรวจอะไรเป็นหลัก?', ['สมาชิกทุกตำแหน่งเท่ากันหรือไม่', 'ความยาวเท่ากันหรือไม่', 'ทั้งสองอ้างถึง object เดียวกันหรือไม่', 'ผลรวมเท่ากันหรือไม่'], 2, '== บน reference ตรวจ identity; การเทียบสมาชิกต้องวนทีละตำแหน่งหรือใช้เมธอดที่เหมาะสม', 'ท้าทาย'),
    T('หลังสร้าง int[] a = new int[5] แล้ว จำนวนช่องของ a เพิ่มหรือลดได้ในภายหลัง', 1, 'ความยาวของ Java array คงที่หลังสร้าง แม้ค่าภายในแต่ละช่องจะเปลี่ยนได้'),
    T('คำสั่ง int[] b = a; สร้างสำเนาสมาชิกทุกตัวแยกจาก a', 1, 'คำสั่งนี้คัดลอก reference ไม่ได้คัดลอกเนื้อหา การแก้ b[0] จึงเห็นผ่าน a[0] ด้วย', 'ท้าทาย'),
    T('ใน Java อาร์เรย์สองมิติอาจมีแถวที่ยาวไม่เท่ากันได้', 0, 'int[][] เป็น array ของ array แต่ละแถวจึงสร้างให้มีความยาวต่างกันได้', 'ท้าทาย'),
    T('สมาชิกของ int[] ที่สร้างใหม่โดยไม่กำหนดค่า เริ่มเป็น 0', 0, 'ค่าเริ่มต้นของ primitive int ใน array คือ 0'),
    R('เมื่อจบโปรแกรม sum มีค่าเท่าไร?', 'int[] a = {4, 2, 5};\nint sum = 0;\nfor (int x : a) sum += x;\nSystem.out.print(sum);', ['9', '11', '20', '452'], 1, 'enhanced for อ่าน 4, 2, 5 ทีละค่า จึงได้ 4 + 2 + 5 = 11'),
    R('หลังลูป a มีค่าอะไร?', 'int[] a = new int[4];\nfor (int i = 0; i < a.length; i++) {\n  a[i] = i * 2;\n}', ['{0, 2, 4, 6}', '{2, 4, 6, 8}', '{0, 1, 2, 3}', '{0, 2, 4, 8}'], 0, 'i รับค่า 0, 1, 2, 3; เขียน 2*i ลงแต่ละตำแหน่ง'),
    R('โค้ดพิมพ์อะไร?', 'int[] a = {7, 3, 9};\nfor (int i = a.length - 1; i >= 0; i--)\n  System.out.print(a[i] + " ");', ['7 3 9', '9 3 7', '9 7 3', '3 7 9'], 1, 'ลูปเริ่มที่ index 2 แล้วลดลงถึง 0 จึงอ่านสมาชิกย้อนกลับ'),
    R('ค่าที่พิมพ์ออกมาคือเท่าไร?', 'int[][] x = {{1, 2}, {3, 4}};\nint total = 0;\nfor (int r = 0; r < x.length; r++)\n  for (int c = 0; c < x[r].length; c++) total += x[r][c];\nSystem.out.print(total);', ['6', '8', '10', '24'], 2, 'ลูปเยี่ยมครบสี่ช่องและบวก 1 + 2 + 3 + 4 = 10'),
    R('หลังทำงาน max มีค่าเท่าไร?', 'int[] a = {-4, -2, -9};\nint max = a[0];\nfor (int i = 1; i < a.length; i++)\n  if (a[i] > max) max = a[i];', ['-9', '-4', '-2', '0'], 2, 'เริ่ม max ที่ -4 แล้วเปลี่ยนเป็น -2; ค่า -9 ไม่มากกว่า -2', 'ท้าทาย'),
    F('เติมเงื่อนไขให้ลูปอ่านสมาชิกครบทุกช่องโดยไม่หลุดขอบ', 'for (int i = 0; ____; i++) {\n  System.out.println(a[i]);\n}', 'i < a.length', 'index สุดท้ายคือ a.length - 1 ดังนั้นหยุดเมื่อ i เท่ากับ length'),
    F('เติม index ของสมาชิกสุดท้ายใน array', 'int lastIndex = ____;', ['a.length - 1', 'a.length-1'], 'length คือจำนวนช่อง แต่ index เริ่มที่ศูนย์'),
    F('สร้าง array ปลายทางให้มีจำนวนช่องเท่ากับต้นทางก่อนคัดลอก', 'int[] copy = new int[____];', 'a.length', 'ต้องสำรองพื้นที่ครบเท่าจำนวนสมาชิกของ a'),
    F('เติมเงื่อนไขที่ทำให้พบความต่างระหว่างสมาชิกตำแหน่ง i ของสอง array', 'if (a[i] ____ b[i]) {\n  return false;\n}', '!=', 'ถ้ามีตำแหน่งหนึ่งไม่เท่ากัน array ทั้งคู่ก็ไม่เท่ากัน', 'ท้าทาย'),
    F('เติมจำนวนแถวของอาร์เรย์สองมิติ table', 'int rowCount = ____;', 'table.length', 'array ชั้นนอกเก็บ reference ของแต่ละแถว')
  ]
});

window.DSA_TOPICS.push({
  id: 'singly', title: 'Singly Linked Lists', icon: '⇢',
  description: 'ตาม head, tail, next และจัดการกรณีว่างหรือมี node เดียว',
  questions: [
    C('ข้อดีสำคัญของ linked list เมื่อเทียบกับ array คือข้อใด?', ['เข้าถึงสมาชิกทุกตำแหน่งได้ O(1)', 'เพิ่มหรือลบตรงจุดที่มี reference ถึงได้โดยไม่เลื่อนสมาชิกทั้งช่วง', 'ใช้หน่วยความจำน้อยกว่า array เสมอ', 'ค้นหาค่าได้ O(1) เสมอ'], 1, 'ลิงก์ช่วยปรับโครงสร้างโดยเปลี่ยน reference แต่การค้นหาตำแหน่งยังต้องเดินตามลิงก์'),
    C('ใน singly linked list ที่เก็บ head และ tail การเพิ่มท้ายรายการที่ไม่ว่างทำอะไร?', ['tail.next = node แล้วเลื่อน tail ไป node ใหม่', 'head = node แล้วคง tail เดิม', 'node.next = head แล้วเลื่อน head', 'เดินจาก head ทุกครั้ง แม้มี tail'], 0, 'tail ชี้ node สุดท้าย จึงต่อ node ใหม่ได้ใน O(1) และอัปเดต tail'),
    C('ถ้ารายการมี node เดียว แล้วลบ node แรก head และ tail ควรเป็นอย่างไร?', ['head เป็น null แต่ tail ยังชี้ node เดิม', 'head และ tail เป็น null', 'head และ tail ชี้ node ถัดไป', 'tail.next ต้องชี้กลับ head'], 1, 'เมื่อ node เดียวถูกลบ รายการว่าง จึงต้องล้าง reference ทั้งสองตัว', 'ท้าทาย'),
    C('การค้นหาค่าใน singly linked list ที่ไม่เรียงลำดับมี worst-case เป็นเท่าไร?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 2, 'กรณีเลวร้ายต้องตรวจทุก node หรือค่าที่ค้นหาไม่มีอยู่'),
    C('ข้อใดเป็น invariant ปกติของ singly linked list แบบไม่วน?', ['tail.next ชี้ head', 'head.next เป็น null เสมอ', 'tail.next เป็น null', 'ทุก node มี previous'], 2, 'รายการแบบไม่วนจบที่ tail ซึ่ง next เป็น null'),
    C('ถ้าต้องลบ node กลางจาก singly linked list และมี reference ของ node ก่อนหน้า ต้องทำอะไร?', ['เปลี่ยน previous.next ให้ข้าม node ที่ลบ', 'เปลี่ยน node.next เป็น head', 'เปลี่ยน tail.next ให้เป็น null เสมอ', 'คัดลอกทุก node ไป array ใหม่'], 0, 'ลิงก์ของ node ก่อนหน้าต้องชี้ไปยัง successor ของ node ที่ถูกลบ', 'ท้าทาย'),
    T('การเพิ่ม node หน้า head ใน singly linked list ทำได้ใน O(1) เมื่อมี head', 0, 'กำหนด new.next เป็น head แล้วเลื่อน head มาที่ new ได้ทันที'),
    T('ถ้ามีเพียง head การเข้าถึง node ลำดับที่ k ทำได้ใน O(1)', 1, 'ต้องเดินผ่านลิงก์ตั้งแต่ต้นสูงสุด k ครั้ง'),
    T('การเพิ่มท้าย linked list ทำได้ใน O(1) เสมอ แม้คลาสเก็บเพียง head', 1, 'มีเพียง head ต้องเดินหา node สุดท้าย O(n); จะ O(1) เมื่อเก็บ tail', 'ท้าทาย'),
    T('ใน list ที่มี node เดียว การลบ node นั้นต้องทำให้รายการกลายเป็นว่าง', 0, 'head และ tail ต้องเป็น null และ size ลดลง'),
    R('หลังเพิ่มท้าย 8 แล้ว ลำดับข้อมูลเป็นอะไร?', 'เริ่ม: head -> 2 -> 5 -> null, tail ชี้ 5\naddLast(8)', ['2 -> 5 -> 8', '8 -> 2 -> 5', '2 -> 8 -> 5', '5 -> 2 -> 8'], 0, 'ต่อ next ของ tail เดิมไปยังโหนดใหม่ แล้วเลื่อน tail ไป 8'),
    R('หลังเรียก removeFirst() แล้ว head ชี้ค่าใด?', 'head -> 4 -> 7 -> 9 -> null\nremoveFirst();', ['4', '7', '9', 'null'], 1, 'head ถูกเลื่อนไปยัง head.next เดิม ซึ่งเป็น node ค่า 7'),
    R('ลูปนี้พิมพ์ค่าใด?', 'head -> 3 -> 6 -> 2 -> null\nfor (Node p = head; p != null; p = p.next)\n  print(p.data);', ['362', '326', '632', '3'], 0, 'เริ่มที่ head และเดิน p = p.next จนถึง null จึงได้ 3, 6, 2'),
    R('รายการเดิมมี 3 -> 8 -> 1 และเรียก addFirst(5) ผลที่ถูกคือข้อใด?', 'newNode.next = head;\nhead = newNode;', ['3 -> 8 -> 1 -> 5', '5 -> 3 -> 8 -> 1', '5 -> 8 -> 1', 'head ยังเป็น 3'], 1, 'ลิงก์ใหม่ชี้ไปยัง head เก่า แล้ว head เปลี่ยนเป็น 5'),
    R('มี list ว่าง size = 0 แล้วเรียก addLast(11) ต้องอัปเดต head และ tail อย่างไร?', '// addLast on an empty list', ['head = newNode; tail = newNode;', 'head.next = newNode;', 'tail.next = newNode;', 'newNode.next = head;'], 0, 'เมื่อไม่มี node เดิม โหนดใหม่เป็นทั้งตัวแรกและตัวสุดท้าย', 'ท้าทาย'),
    F('เติมลิงก์ให้โหนดใหม่แทรกหน้ารายการเดิม', 'newNode.next = ____;\nhead = newNode;', 'head', 'ต้องรักษา reference ไปยังรายการเดิมก่อนย้าย head'),
    F('เติมคำสั่งอัปเดต tail หลังต่อ node ใหม่', 'tail.next = newNode;\ntail = ____;', 'newNode', 'tail ต้องอ้าง node สุดท้ายหลังการเพิ่ม'),
    F('เติมเงื่อนไขให้ traversal จบเมื่อเดินพ้น node สุดท้าย', 'for (Node p = head; ____; p = p.next)', ['p != null', 'null != p'], 'หลัง tail.next ซึ่งเป็น null เงื่อนไขต้องหยุด'),
    F('เติมการอัปเดต head หลังลบ node แรก', 'head = ____;', 'head.next', 'head ใหม่คือ successor ของ head เดิม'),
    F('เมื่อ size เริ่ม 1 และลบ node เดียว ให้เติมค่า tail', 'head = null;\ntail = ____;', 'null', 'รายการว่างต้องไม่มีทั้ง head และ tail', 'ท้าทาย')
  ]
});

window.DSA_TOPICS.push({
  id: 'linked-advanced', title: 'Circular / Doubly Lists และ Big-O', icon: '⟳',
  description: 'รักษาลิงก์สองทิศ วนรอบ และประเมินการเติบโตของงาน',
  questions: [
    C('ใน circular singly linked list ที่เก็บ tail ตัวแรกของวงคือ node ใด?', ['tail.next', 'tail', 'tail.next.next เสมอ', 'null'], 0, 'tail.next คือ head ของวง และไม่มี null ปิดท้าย'),
    C('ใน circular list ที่มี node เดียว ลิงก์ next ควรเป็นอย่างไร?', ['เป็น null', 'ชี้กลับมาที่ node เดิม', 'ชี้ไปยัง tail อีกตัว', 'ชี้ไปยัง head ที่ไม่มีอยู่'], 1, 'node เดียวต้องวนกลับหาตัวเองเพื่อคงความเป็นวง'),
    C('การ rotate circular list ที่เก็บ tail ทำได้อย่างไรถ้าต้องการให้ head เก่ากลายเป็นท้าย?', ['tail = tail.next', 'tail = tail.next.next', 'tail.next = null', 'head = null'], 0, 'tail.next เดิมเป็น head; เลื่อน tail ไป head ทำให้ node ถัดไปเป็น head ใหม่', 'ท้าทาย'),
    C('การมีทั้ง prev และ next ใน doubly linked list ให้ประโยชน์ใดโดยตรง?', ['ค้นหาค่าที่ไม่เรียงได้ O(1)', 'เดินย้อนกลับและลบ node ที่มี reference ถึงได้สะดวก', 'ทุก insertion เป็น O(log n)', 'ไม่ต้องเก็บ head'], 1, 'ลิงก์สองทิศช่วยย้อนทางและแก้ pointer รอบ node; การค้นหายังอาจเป็น O(n)'),
    C('เหตุใด doubly linked list บางแบบจึงใช้ sentinel head/tail?', ['ทำให้สมาชิกเรียงอัตโนมัติ', 'ลดกรณีพิเศษที่ขอบ เช่น รายการว่างหรือเพิ่มหน้าสุด', 'ทำให้ใช้พื้นที่น้อยกว่า SLL', 'ทำให้ไม่มี pointer'], 1, 'sentinel เป็น node ยามช่วยให้การปรับลิงก์มีรูปแบบสม่ำเสมอ', 'ท้าทาย'),
    C('ลูปเดี่ยวที่ทำงาน n รอบและมีงานคงที่ในแต่ละรอบมี Big-O เท่าไร?', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 2, 'จำนวน primitive operations โตตาม n และละค่าคงที่ใน Big-O'),
    T('การเพิ่ม node หน้า circular list โดยเก็บ tail สามารถเปลี่ยน tail.next แล้วเสร็จใน O(1)', 0, 'ตั้ง new.next เป็น head เดิม แล้ว tail.next เป็น new ได้โดยไม่ต้อง traversal'),
    T('ใน doubly linked list ถ้า p.next = q แล้ว q.prev ควรชี้กลับ p', 0, 'คู่ prev/next ต้องสอดคล้องกันเพื่อให้เดินได้ทั้งสองทาง'),
    T('ลูปซ้อนสองชั้นที่แต่ละชั้นวิ่ง n รอบมีงาน O(n²)', 0, 'จำนวนคู่รอบคือ n × n'),
    T('การเขียนแบบลดรูปตามธรรมเนียมของ 5n + 3 คือ O(5n)', 1, 'เมื่อลดรูป Big-O ให้ตัดค่าคงที่ทิ้ง จึงเขียนเป็น O(n)', 'ท้าทาย'),
    R('ก่อน rotate วงเป็น A -> B -> C -> กลับ A และ tail ชี้ C หลัง tail = tail.next แล้ว head ใหม่คืออะไร?', 'tail เดิม = C\nhead เดิม = A', ['A', 'B', 'C', 'null'], 1, 'tail ใหม่คือ A และ head ใหม่คือ tail.next ซึ่งเป็น B', 'ท้าทาย'),
    R('ลูปนี้ทำงานกี่ครั้งเมื่อ n = 4?', 'for (int i = 0; i < n; i++)\n  for (int j = 0; j < n; j++) work();', ['4', '8', '12', '16'], 3, 'แต่ละ i มี 4 รอบของ j จึงรวม 4 × 4 = 16'),
    R('ลำดับวงคือ 1 -> 2 -> 3 -> กลับ 1; เริ่ม p = head แล้ววนจน p กลับ head จะพิมพ์กี่ค่า?', 'do {\n  print(p.data);\n  p = p.next;\n} while (p != head);', ['2', '3', '4', 'วนไม่จบ'], 1, 'จาก head เดินผ่านสาม node แล้ว p กลับ head; จำนวนค่าที่พิมพ์คือ 3'),
    R('ถ้าลบ q ระหว่าง p และ r ใน DLL แล้วตั้ง p.next = r แต่ลืม r.prev = p จะเกิดอะไร?', 'p <-> q <-> r\n// ลบ q โดยปรับด้านเดียว', ['เดินไปข้างหน้าเสียทันที', 'เดินย้อนจาก r ยังพบ q ที่ถูกถอดออก', 'size เพิ่มขึ้น', 'tail เปลี่ยนเป็น p'], 1, 'pointer ด้านหน้าเปลี่ยนแล้ว แต่ prev ของ r ยังชี้ q ทำให้โครงสร้างไม่สมมาตร', 'ท้าทาย'),
    R('ฟังก์ชันดังกล่าวมี Big-O เท่าไร?', 'for (int i = 1; i < n; i *= 2)\n  work();', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 1, 'i เพิ่มเป็นสองเท่าทุกครั้ง จำนวนรอบประมาณ log₂ n'),
    F('เติมลิงก์ของ node ใหม่ให้เข้าเป็น head ของ circular list ซึ่งเก็บ tail', 'newNode.next = ____;\ntail.next = newNode;', 'tail.next', 'head เดิมคือ tail.next จึงต้องให้ node ใหม่ชี้ไป head เดิม', 'ท้าทาย'),
    F('เติม pointer ย้อนกลับเพื่อให้การลบ q ใน DLL สมบูรณ์', 'p.next = q.next;\nq.next.prev = ____;', 'p', 'successor ของ q ต้องย้อนกลับไป predecessor ของ q'),
    F('เติมเงื่อนไขให้ traversal ของวงหยุดก่อนเริ่มวนซ้ำ node แรก', 'while (____) {\n  p = p.next;\n}', 'p.next != start', 'หยุดเมื่อ node ถัดไปคือจุดเริ่มต้น โดยยังประมวลผล node สุดท้ายครบ'),
    F('ลูปเดี่ยว n รอบตามด้วยงานคงที่ มี Big-O ใด?', 'T(n) = 7n + 20  =>  ____', 'O(n)', 'พจน์เชิงเส้นครองการเติบโต จึงเป็น O(n)'),
    F('เติมจำนวนรอบชั้นนอกเพื่อให้ลูปซ้อนนี้ทำงาน n² รอบ', 'for (int i = 0; i < ____; i++)\n  for (int j = 0; j < n; j++) work();', 'n', 'ทั้งสองลูปวิ่ง n รอบ จึงเกิด n × n รอบ')
  ]
});

window.DSA_TOPICS.push({
  id: 'recursion', title: 'Recursion', icon: '↻',
  description: 'แยก base case ไล่ call stack และนับจำนวนงาน',
  questions: [
    C('ส่วนใดจำเป็นเพื่อให้ recursive method จบได้?', ['มี base case และ recursive call เข้าใกล้ base case', 'เรียกตัวเองอย่างน้อยสองครั้ง', 'มี for loop อยู่ภายใน', 'คืนค่าเป็น int เท่านั้น'], 0, 'base case หยุดการเรียกซ้ำ และแต่ละ call ต้องลดปัญหาหรือเข้าใกล้เงื่อนไขหยุด'),
    C('เมธอด factorial แบบ recursive ควรกำหนดค่าใดเป็นฐาน?', ['fact(0) = 0', 'fact(0) = 1', 'fact(1) = 0', 'fact(n) = n สำหรับทุก n'], 1, '0! = 1 เป็นฐาน และ fact(n) = n × fact(n-1)'),
    C('ทำไม naive Fibonacci จึงใช้เวลามากกว่า linear recursion ทั่วไป?', ['เพราะใช้ array', 'เพราะ fib(n) เรียก fib(n-1) และ fib(n-2) ทำให้คำนวณซ้ำมาก', 'เพราะไม่มี base case', 'เพราะทุก call เป็น O(n²)'], 1, 'ต้นไม้การเรียกแตกแขนงและ subproblem ซ้ำกัน จึงมีจำนวน call เติบโตแบบ exponential', 'ท้าทาย'),
    C('Tower of Hanoi แบบ recursive ต้องใช้การย้ายขั้นต่ำกี่ครั้งสำหรับ n แผ่น?', ['n²', '2n', '2ⁿ - 1', 'n!'], 2, 'จำนวนย้ายเป็น T(n) = 2T(n-1) + 1 จึงได้ 2ⁿ - 1', 'ท้าทาย'),
    C('ถ้า recursive method ทำหนึ่ง call ต่อระดับจนถึง n และทำงานคงที่ต่อระดับ ความซับซ้อนคืออะไร?', ['O(1)', 'O(log n)', 'O(n)', 'O(2ⁿ)'], 2, 'มีประมาณ n ระดับและแต่ละระดับทำงานคงที่'),
    C('ข้อใดอธิบาย stack ของ recursive calls ได้ถูกต้อง?', ['call ล่าสุดจะกลับก่อน call เก่ากว่า', 'call แรกกลับก่อน call สุดท้าย', 'ทุก call ใช้ local variables ชุดเดียวกัน', 'stack ไม่เพิ่มตามความลึก'], 0, 'call stack เป็น LIFO; เมื่อ base case คืนค่า call ที่ลึกสุดคลี่คลายก่อน', 'ท้าทาย'),
    T('ถ้า recursive call ใช้ argument เดิมทุกครั้งและไม่มีเงื่อนไขหยุด การเรียกซ้ำอาจไม่สิ้นสุด', 0, 'ปัญหาไม่เล็กลงและไม่ถึง base case จึงเกิด infinite recursion หรือ stack overflow'),
    T('linear recursion หนึ่ง call ต่อระดับลึก n ระดับใช้ call stack O(n)', 0, 'ก่อนคืนค่าจะมี call ค้างอยู่ประมาณ n ชั้น', 'ท้าทาย'),
    T('การเรียก fib(5) แบบ fib(n-1) + fib(n-2) คำนวณ fib(3) เพียงครั้งเดียว', 1, 'fib(4) และ fib(5) ต่างทำให้ fib(3) ถูกคำนวณซ้ำ', 'ท้าทาย'),
    T('ถ้า method พิมพ์ n ก่อน recursive call และลด n จนถึง 1 ค่าที่พิมพ์จะเรียงจากมากไปน้อย', 0, 'การพิมพ์เกิดก่อนการเรียกลงลึก จึงเห็น n, n-1, ... ก่อน unwind'),
    R('ผลลัพธ์ของ fact(4) คือเท่าไร?', 'int fact(int n) {\n  if (n == 0) return 1;\n  return n * fact(n - 1);\n}', ['10', '16', '24', '4'], 2, '4 × 3 × 2 × 1 × fact(0) = 24'),
    R('โค้ดพิมพ์อะไรเมื่อเรียก f(3)?', 'void f(int n) {\n  if (n == 0) return;\n  print(n);\n  f(n - 1);\n  print(n);\n}', ['3 2 1 1 2 3', '1 2 3 3 2 1', '3 2 1', '1 2 3'], 0, 'พิมพ์ก่อน call คือ 3, 2, 1; หลัง call คลี่กลับคือ 1, 2, 3', 'ท้าทาย'),
    R('ถ้า F(0)=0, F(1)=1 และ F(n)=F(n-1)+F(n-2), F(5) เท่ากับเท่าไร?', 'F(2), F(3), ...', ['3', '5', '8', '13'], 1, 'ลำดับคือ 0, 1, 1, 2, 3, 5'),
    R('ผลรวมที่ sum(a, 3) คืนค่าคือเท่าไร เมื่อ sum รวม a[0] ถึง a[n-1]?', 'int[] a = {2, 4, 1};\nint sum(int[] a, int n) {\n  if (n == 0) return 0;\n  return sum(a, n - 1) + a[n - 1];\n}', ['5', '6', '7', '9'], 2, 'sum(a,3) รวม 2 + 4 + 1 = 7'),
    R('Tower of Hanoi สำหรับ 3 แผ่นต้องย้ายขั้นต่ำกี่ครั้ง?', 'T(n) = 2T(n - 1) + 1\nT(1) = 1', ['5', '6', '7', '8'], 2, 'T(2)=3 และ T(3)=2×3+1=7', 'ท้าทาย'),
    F('เติม base case ให้ factorial ถูกต้อง', 'int fact(int n) {\n  if (n == ____) return 1;\n  return n * fact(n - 1);\n}', '0', 'เมื่อ n ลดลงถึงศูนย์ ต้องคืน 1 เพื่อให้ผลคูณไม่เปลี่ยนค่า'),
    F('เติม argument ให้ recursion ลดขนาดลงทีละหนึ่ง', 'return n + sum(____);', 'n - 1', 'n-1 ทำให้ปัญหาเล็กลงและเข้าใกล้ base case'),
    F('เติมเงื่อนไขที่ป้องกัน fib จากการเรียกซ้ำเมื่อ n เป็น 0 หรือ 1', 'if (____) return n;', ['n <= 1', 'n < 2', 'n == 0 || n == 1'], 'F(0) และ F(1) เป็นค่าฐาน', 'ท้าทาย'),
    F('เติม recurrence สำหรับจำนวนครั้งย้าย Hanoi เมื่อ n มากกว่า 1', 'T(n) = ____ + 1', ['2 * T(n - 1)', '2T(n-1)', '2 * t(n-1)'], 'ย้าย n-1 แผ่นไปพัก ย้ายแผ่นใหญ่หนึ่งครั้ง แล้วย้าย n-1 กลับ', 'ท้าทาย'),
    F('ถ้าต้องพิมพ์ค่าตอนคลี่ call stack ให้วาง print หลัง recursive call', 'void f(int n) {\n  if (n == 0) return;\n  f(n - 1);\n  ____;\n}', ['print(n)', 'system.out.print(n)'], 'คำสั่งหลัง call ทำงานขณะ recursion unwind')
  ]
});

window.DSA_QUESTIONS = window.DSA_TOPICS.flatMap(topic =>
  topic.questions.map((q, index) => window.DSA_BUILD_RECORD(topic, q, index))
);
window.DSA_TOPICS.push({
  id: 'stacks', title: 'Stacks', icon: '▤',
  description: 'เข้าใจ LIFO การใช้ call stack และแปลงนิพจน์',
  questions: [
    C('หลักการของ stack คืออะไร?', ['FIFO: เข้าก่อนออกก่อน', 'LIFO: เข้าหลังออกก่อน', 'เรียงตามค่าจากน้อยไปมาก', 'เข้าถึงทุกตำแหน่งด้วย index'], 1, 'stack เพิ่มและนำออกที่ปลายเดียวกัน จึงเป็น Last In, First Out'),
    C('ต่างกันอย่างไรระหว่าง peek() กับ pop()?', ['ทั้งคู่เอาสมาชิกบนสุดออก', 'peek อ่านบนสุดโดยไม่เอาออก ส่วน pop เอาออก', 'peek เพิ่มสมาชิก ส่วน pop อ่าน', 'pop ใช้ได้เฉพาะ stack ว่าง'], 1, 'peek ไม่เปลี่ยนสถานะ; pop ลดขนาด stack'),
    C('ถ้า array stack ใช้ size แทนตำแหน่งถัดไปที่ว่าง index บนสุดคืออะไรเมื่อ stack ไม่ว่าง?', ['size', 'size - 1', 'size + 1', 'capacity - 1'], 1, 'สมาชิกตัวบนสุดอยู่ช่องก่อนตำแหน่งว่างถัดไป'),
    C('เมื่อ array-backed stack เต็มก่อน push ค่าใหม่ วิธีจัดการแบบ dynamic array ทั่วไปคืออะไร?', ['ทิ้งสมาชิกเก่าสุด', 'ขยาย array แล้วคัดลอกสมาชิกเดิม', 'เลื่อนสมาชิกทุกตัวไปทางซ้ายแล้วเขียนทับ', 'เปลี่ยนเป็น FIFO'], 1, 'การขยายความจุแล้วคัดลอกทำให้ push ส่วนใหญ่ O(1) แบบ amortized'),
    C('เหตุใด stack จึงตรวจวงเล็บเปิด/ปิดแบบซ้อนกันได้ดี?', ['วงเล็บคู่แรกต้องจับคู่ก่อนเสมอ', 'ตัวเปิดล่าสุดที่ยังไม่จับคู่ต้องปิดก่อน', 'ต้องเรียงวงเล็บตาม ASCII', 'เพราะ stack ค้นหาได้ O(1) ทุกตำแหน่ง'], 1, 'ลำดับการจับคู่แบบซ้อนตรงกับ LIFO'),
    C('เมื่อแปลง infix เป็น postfix โดยใช้ stack ตัวดำเนินการใดเป็นหลัก?', ['operand ถูก push ทุกครั้ง', 'operator ถูกค้างไว้จน precedence/วงเล็บอนุญาตให้ปล่อยออก', 'ตัวเลขถูกเรียงจากน้อยไปมาก', 'ไม่ต้องสนใจวงเล็บ'], 1, 'stack เก็บ operator ที่ยังปล่อยไม่ได้ โดยจัดการ precedence และวงเล็บ'),
    T('pop() บน stack ว่างควรคืนข้อมูลสมาชิกบนสุดได้ตามปกติ', 1, 'ไม่มีสมาชิกให้คืน ต้องรายงาน underflow หรือใช้สัญญาการคืนค่าเฉพาะของ implementation'),
    T('หลัง push(A), push(B), pop() ค่า B ถูกนำออกก่อน A', 0, 'B เข้าทีหลังจึงอยู่บนสุดและออกก่อน'),
    T('peek() ควรเปลี่ยน size ของ stack', 1, 'peek อ่านค่าแต่ไม่เอาสมาชิกออก ขนาดจึงไม่เปลี่ยน'),
    T('นิพจน์ postfix 8 3 - คำนวณเป็น 5', 0, 'operator ลบทำงานกับ operand ตามลำดับ: 8 - 3 = 5'),
    R('หลังชุดคำสั่งนี้ peek() คืนค่าใด?', 'push(4);\npush(7);\npop();\npeek();', ['4', '7', '11', 'ไม่มีค่า'], 0, 'pop นำ 7 ออก จึงเหลือ 4 เป็นสมาชิกบนสุด'),
    R('สตริงวงเล็บ ([{}]) สมดุลตามชนิดหรือไม่?', '([{}])', ['สมดุล', 'ไม่สมดุล เพราะจำนวนตัวเปิดไม่เท่าตัวปิด', 'ไม่สมดุล เพราะวงเล็บเหลี่ยมปิดก่อนปีกกา', 'ไม่สมดุล เพราะ stack ต้องว่างตั้งแต่เริ่ม'], 0, 'ทุกตัวปิดตรงกับชนิดของตัวเปิดล่าสุด และสุดท้าย stack ว่าง'),
    R('สตริงวงเล็บ ([)] สมดุลตามชนิดหรือไม่?', '([)]', ['สมดุล เพราะมีตัวเปิดสองตัวและปิดสองตัว', 'ไม่สมดุล เพราะ ) ไม่ตรงกับ [ ที่อยู่บนสุด', 'สมดุลถ้าไม่นับวงเล็บเหลี่ยม', 'ไม่สมดุลเฉพาะเมื่อมีวงเล็บปีกกา'], 1, 'เมื่ออ่าน ) ตัวเปิดบนสุดคือ [ จึงชนิดไม่ตรง แม้จำนวนเปิดและปิดจะเท่ากัน'),
    R('ค่าของ postfix expression นี้คือเท่าไร?', '5 2 + 3 *', ['11', '21', '25', '35'], 1, 'คำนวณ 5+2 = 7 แล้ว 7×3 = 21'),
    R('หลังคำสั่งทั้งหมด stack จากล่างขึ้นบนเป็นอะไร?', 'push(A); push(B); pop(); push(C);', ['A, B, C', 'A, C', 'C, A', 'B, C'], 1, 'pop เอา B ออก เหลือ A แล้ว push C ไว้ด้านบน'),
    F('เติม index สำหรับอ่านสมาชิกบนสุดเมื่อ size แทนจำนวนสมาชิก', 'return data[____];', 'size - 1', 'สมาชิกบนสุดอยู่ตำแหน่งก่อนช่องว่างถัดไป'),
    F('เติมเงื่อนไขป้องกัน pop จาก stack ว่าง', 'if (____) throw new EmptyStackException();', 'size == 0', 'ขนาดศูนย์หมายถึงไม่มีสมาชิกให้เอาออก'),
    F('เติมการลด size ก่อนอ่านค่าที่กำลัง pop', 'int value = data[____];', '--size', 'เมื่อ size เป็นจำนวนสมาชิก ช่องบนสุดเดิมคือ data[--size]'),
    F('เมื่อตรวจ closing bracket แล้ว stack ว่าง แปลว่าไม่มี opening bracket ที่ต้องจับคู่ เติมเงื่อนไขนี้', 'if (____) return false;', 'stack.isEmpty()', 'closing bracket ที่ไม่มีตัวเปิดคู่เป็น mismatch'),
    F('เติม postfix ของนิพจน์ (3 + 4) * 2', 'Postfix: ____', '3 4 + 2 *', 'วงเล็บทำให้ 3 และ 4 รวมก่อน แล้วผลคูณด้วย 2')
  ]
});

window.DSA_TOPICS.push({
  id: 'queues', title: 'Queues', icon: '⇥',
  description: 'ตาม front/rear และเข้าใจ circular array ที่ wrap-around',
  questions: [
    C('หลักการของ queue คืออะไร?', ['LIFO', 'FIFO', 'เรียงตาม priority เสมอ', 'เพิ่มและลบได้เฉพาะตรงกลาง'], 1, 'สมาชิกที่เข้าก่อนจะถูกนำออกก่อน'),
    C('ใน circular array queue เมื่อนำ front ออกแล้ว front ควรเลื่อนไปอย่างไร?', ['front = front - 1', 'front = (front + 1) % capacity', 'front = rear', 'front = size'], 1, 'การ modulo ทำให้ index วนกลับจากท้าย array ไปต้น array'),
    C('เหตุใด circular queue จึงดีกว่า array queue แบบเลื่อนสมาชิกทุกครั้งที่ dequeue?', ['ไม่ต้องเก็บสมาชิก', 'ใช้ช่องว่างด้านหน้าซ้ำได้โดยไม่ขยับสมาชิกทั้งหมด', 'dequeue กลายเป็น O(log n)', 'ทำให้ queue เป็น LIFO'], 1, 'front/rear หมุนวนใช้ array ซ้ำได้ จึงหลีกเลี่ยงการเลื่อน O(n)'),
    C('ถ้า array circular queue มี capacity 8 และ rear อยู่ index 7 ช่องถัดไปคืออะไร?', ['8', '0', '7', '1'], 1, '(7 + 1) % 8 = 0'),
    C('โครงสร้างใดเหมาะกับงานจำลองคิวผู้โดยสารที่เข้าก่อนควรได้รับบริการก่อน?', ['Stack', 'Queue', 'Binary search tree', 'Hash table'], 1, 'ลำดับให้บริการเป็น FIFO จึงใช้ queue'),
    C('ถ้าใช้ front, rear และ size แยกกัน การแยก empty กับ full ทำได้อย่างไร?', ['front == rear ใช้ทั้งคู่เสมอ', 'size == 0 คือ empty และ size == capacity คือ full', 'rear == 0 คือ empty', 'front == capacity คือ full'], 1, 'ตัวแปร size ช่วยแยกสถานะที่ index อาจเท่ากันใน circular array'),
    T('dequeue() นำสมาชิกที่เข้ามาล่าสุดออกก่อน', 1, 'queue เป็น FIFO จึงนำสมาชิกที่เข้าก่อนสุดออก'),
    T('circular array queue อาจมี front index มากกว่า rear index ขณะยังมีสมาชิก', 0, 'หลัง wrap-around rear อาจกลับไปต้น array ขณะที่ front ยังอยู่ท้าย'),
    T('ใน queue ว่าง การ peek() ควรอ่านสมาชิกได้โดยไม่ต้องตรวจเงื่อนไขใด', 1, 'ต้องจัดการกรณีว่าง เช่น โยน exception หรือคืนค่าตามสัญญา'),
    T('การใช้ rear = (rear + 1) % capacity ทำให้ rear วนกลับเป็น 0 เมื่อถึงท้าย array', 0, 'เมื่อ rear อยู่ capacity-1 ผล modulo จะเป็นศูนย์'),
    R('คิวเริ่ม [A, B, C] โดย front ชี้ A ทำ dequeue() แล้ว peek() ได้อะไร?', 'dequeue();\npeek();', ['A', 'B', 'C', 'คิวว่าง'], 1, 'dequeue เอา A ออกแล้ว front เลื่อนไป B'),
    R('capacity = 5, front = 4 และมีสมาชิกอยู่ 2 ตัว หลัง dequeue แล้ว front เป็น index ใด?', '(front + 1) % capacity', ['0', '1', '3', '4'], 0, '(4 + 1) % 5 = 0'),
    R('capacity = 6, rear = 5 แล้ว enqueue หนึ่งตัว rear ใหม่เป็นเท่าไร?', '(rear + 1) % capacity', ['0', '1', '5', '6'], 0, '(5 + 1) % 6 = 0'),
    R('เริ่มคิวว่าง แล้ว enqueue(A), enqueue(B), dequeue(), enqueue(C); ลำดับจาก front คืออะไร?', 'capacity มากกว่า 2', ['A, B, C', 'B, C', 'C, B', 'A, C'], 1, 'นำ A ออกแล้วเหลือ B จากนั้นต่อ C ท้ายคิว'),
    R('การ dequeue สมาชิกสุดท้ายของ queue ที่เก็บ size ควรทำให้สถานะใด?', 'ก่อน dequeue: size = 1', ['size = 0 และ queue ว่าง', 'size = 1 และ front ชี้ null', 'size = capacity', 'front และ rear ต้องชี้ index 0 เสมอ'], 0, 'ลด size จากหนึ่งเป็นศูนย์จึงเป็น queue ว่าง; การ normalize index ขึ้นกับ implementation'),
    F('เติมสูตรเลื่อน front ใน circular array queue', 'front = (front + 1) ____ capacity;', '%', 'modulo ทำให้ index วนกลับเมื่อข้ามช่องสุดท้าย'),
    F('เติมสูตรเลื่อน rear หลัง enqueue', 'rear = (rear + 1) ____ capacity;', '%', 'rear ต้องวนกลับในช่วง 0 ถึง capacity - 1'),
    F('เติมเงื่อนไขตรวจ queue ว่างเมื่อใช้ตัวแปร size', 'boolean isEmpty() { return ____; }', 'size == 0', 'size ศูนย์หมายถึงไม่มีสมาชิก'),
    F('เติมการเพิ่มจำนวนสมาชิกหลัง enqueue สำเร็จ', 'data[rear] = element;\nsize ____;', '++', 'เมื่อบันทึกสมาชิกใหม่สำเร็จ จำนวนสมาชิกเพิ่มหนึ่ง'),
    F('เติมข้อมูลที่ควรอ่านจากตำแหน่งหน้า queue ใน dequeue แบบ array', 'int answer = data[____];', 'front', 'dequeue คืนสมาชิกที่ front ชี้ก่อนขยับ front')
  ]
});

window.DSA_TOPICS.push({
  id: 'hashing', title: 'Hash Tables', icon: '#',
  description: 'แปลง key เป็น index จัดการ collision และประเมินประสิทธิภาพ',
  questions: [
    C('หน้าที่หลักของ hash function ใน hash table คืออะไร?', ['เรียง key จากน้อยไปมาก', 'แปลง key ให้เป็น hash code ที่ใช้คำนวณตำแหน่งจัดเก็บ', 'แก้ collision ได้โดยไม่ต้องมีกลยุทธ์อื่น', 'บีบอัดค่าทุก key ให้ไม่ซ้ำกัน'], 1, 'hash code ช่วยระบุตำแหน่งเริ่มต้น แต่หลาย key ยังอาจชนกันได้'),
    C('ถ้าขนาด table คือ m และ hash code เป็นจำนวนเต็ม index ที่มักใช้ได้คือข้อใด?', ['hashCode * m', 'hashCode % m', 'hashCode + m', 'm / hashCode'], 1, 'compression ด้วย modulo map ค่าให้อยู่ในช่วง index ของ table'),
    C('ข้อใดอธิบาย collision ได้ถูกต้อง?', ['key สองตัวมีค่าเท่ากันเท่านั้น', 'key ต่างกันได้ index เดียวกัน', 'table ไม่มีช่องว่าง', 'hash code ต้องเป็นลบ'], 1, 'collision เกิดได้แม้ key ไม่เท่ากัน เพราะตำแหน่งมีจำกัด'),
    C('linear probing จัดการ collision อย่างไร?', ['เก็บทุก key ใน linked list ที่ index เดียว', 'ตรวจช่องถัดไปตามลำดับจนพบช่องว่าง', 'ขยาย table ทุกครั้งที่ชน', 'ทิ้ง key ใหม่'], 1, 'linear probing สำรวจ index ถัดไปและวนกลับเมื่อถึงท้าย table'),
    C('separate chaining เก็บ key ที่ชนกันอย่างไร?', ['ใส่ key ทั้งหมดใน bucket/list ของ index เดียวกัน', 'ย้าย key ทั้งหมดไป index 0', 'เปลี่ยน hash function ทุกครั้ง', 'ลบทิ้ง key ที่ชน'], 0, 'แต่ละ bucket เก็บ collection ของ entry ที่ map มายัง index นั้น'),
    C('อะไรเกิดขึ้นได้เมื่อ load factor สูงมากใน open addressing?', ['probe sequence ยาวขึ้นและ operation ช้าลง', 'collision หายไป', 'table ใช้พื้นที่น้อยลงเสมอ', 'hash function กลายเป็น O(1) แน่นอน'], 0, 'ช่องว่างเหลือน้อยทำให้ต้อง probe หลายตำแหน่ง'),
    T('key ที่เท่ากันตาม equality ต้องสร้าง hash code ที่เท่ากันเพื่อให้ hash table ทำงานถูกต้อง', 0, 'เงื่อนไขของ hash contract คือ equal objects ต้องมี hash code เท่ากัน'),
    T('hash function ที่ดีรับประกันว่าจะไม่มี collision', 1, 'จำนวน key ที่เป็นไปได้มักมากกว่า slot จึง collision ได้; hash function ที่ดีช่วยกระจายเท่านั้น'),
    T('การลบ entry จาก linear probing แล้วเปลี่ยนช่องเป็น empty ทันทีอาจทำให้ค้นหา entry ถัดไปไม่พบ', 0, 'การค้นหาหยุดที่ช่องว่าง จึงต้องใช้ tombstone หรือซ่อม probe cluster'),
    T('separate chaining ยังเก็บ key ที่มี index เดียวกันได้มากกว่าหนึ่งรายการ', 0, 'bucket เดียวมี list หรือ collection สำหรับ entries ที่ชนกัน'),
    R('table size 5 ใช้ index = key % 5; key 12 เริ่มค้นหาที่ index ใด?', 'h(k) = k % 5', ['0', '1', '2', '3'], 2, '12 % 5 = 2'),
    R('linear probing: ช่อง 2 มี 12, ช่อง 3 มี 18, ช่อง 4 ว่าง; key 23 เริ่มที่ 2 ควรใส่ที่ใด?', 'table size = 5; h(23) = 2', ['2', '3', '4', '0'], 2, 'ตรวจ 2 ชน, ตรวจ 3 ชน, ช่อง 4 ว่างจึงแทรกที่ 4'),
    R('table size 7, index เริ่มต้น 6 และช่อง 6,0 ถูกใช้; linear probing จะตรวจช่องว่างถัดไปที่ใด?', 'indices วน modulo 7', ['1', '2', '5', '6'], 0, 'จาก 6 วนไป 0 แล้วช่องถัดไปคือ 1'),
    R('ถ้า hash function กระจาย key ได้ดีและ load factor ต่ำ การค้นหาเฉลี่ยมักเป็นอย่างไร?', 'Expected time', ['O(1) โดยเฉลี่ย', 'O(log n) เสมอ', 'O(n²)', 'O(n log n)'], 0, 'ภายใต้การกระจายเหมาะสมและ load factor คุมไว้ การตรวจ bucket/probe เฉลี่ยคงที่'),
    R('hash code อาจติดลบ; เหตุใดการใช้ Math.abs(hash) % m จึงมี edge case?', 'ใน Java ค่าติดลบต่ำสุด abs แล้วยังติดลบได้', ['เพราะ abs ทำให้เป็นศูนย์เสมอ', 'เพราะค่าติดลบต่ำสุดอาจยังติดลบหลัง abs', 'เพราะ modulo ใช้กับ int ไม่ได้', 'ไม่มี edge case'], 1, 'ค่าต่ำสุดของ signed integer ไม่มีค่าบวกที่แทนได้ในชนิดเดิม; ใช้ floorMod หรือจัดการให้ถูก'),
    F('เติม compression function สำหรับ index เมื่อ m คือความจุ', 'int index = hashCode ____ m;', '%', 'modulo จำกัดตำแหน่งให้อยู่ในช่วงของ table'),
    F('หลังช่องเริ่มต้นชน ให้ตรวจ index ถัดไปใน linear probing', 'index = (index + 1) ____ capacity;', '%', 'modulo ทำให้ probe วนกลับที่ต้น table'),
    F('เติม load factor เมื่อเก็บ n entries ใน table ที่มี m ช่อง', 'loadFactor = ____;', 'n / (double) m', 'load factor คือจำนวน entries หารด้วยความจุ'),
    F('ถ้า keyA.equals(keyB) เป็นจริง ต้องเติมความสัมพันธ์ใดใน hash contract?', 'keyA.hashCode() ____ keyB.hashCode()', '==', 'object ที่เท่ากันต้องมี hash code เท่ากัน'),
    F('สำหรับกรณี hashCode อาจติดลบ ให้ใช้ฟังก์ชัน Java ใดเพื่อให้ modulo เป็น index ไม่ติดลบ?', 'index = Math.____(hashCode, capacity);', 'floorMod', 'Math.floorMod จัดการเศษให้เหมาะกับตัวหารบวก')
  ]
});
window.DSA_TOPICS.push({
  id: 'search-sort', title: 'Searching และ Sorting', icon: '↕',
  description: 'เลือกวิธีค้นหา ไล่ pass และเปรียบเทียบเวลา/พื้นที่',
  questions: [
    C('binary search ใช้ได้ถูกต้องเมื่อข้อมูลมีคุณสมบัติสำคัญใด?', ['ข้อมูลถูก sort ตามลำดับที่ใช้เปรียบเทียบ', 'ข้อมูลไม่มีค่าซ้ำ', 'จำนวนสมาชิกเป็นเลขคู่', 'ใช้เฉพาะ linked list'], 0, 'การทิ้งครึ่งหนึ่งของช่วงทำได้เพราะรู้ทิศทางจากลำดับที่เรียงแล้ว'),
    C('worst-case ของ linear search บนข้อมูล n ค่าเป็นเท่าไร?', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 2, 'อาจต้องตรวจทุกค่าเมื่อเจอเป้าหมายท้ายสุดหรือไม่มีเป้าหมาย'),
    C('ถ้า array เกือบเรียงแล้วและขนาดไม่ใหญ่มาก insertion sort มีจุดเด่นข้อใด?', ['โดยทั่วไปทำงานดีเมื่อมี inversion น้อย', 'มี worst-case O(log n)', 'ไม่ต้องเปรียบเทียบสมาชิก', 'ใช้ได้เฉพาะข้อมูลจำนวนคู่'], 0, 'แต่ละค่าแทรกเข้า prefix ที่เรียงแล้ว จึงทำงานน้อยเมื่อข้อมูลเกือบเรียง'),
    C('merge sort บน array โดยทั่วไปแลกอะไรเพื่อได้เวลา O(n log n)?', ['ใช้พื้นที่ชั่วคราว O(n) ระหว่าง merge', 'เพิ่มเวลาเป็น O(n²)', 'ไม่ต้องแบ่งข้อมูล', 'ทำให้ข้อมูลเปลี่ยนชนิด'], 0, 'merge ต้องรวมสองช่วงที่เรียงแล้ว มักใช้ array ชั่วคราว'),
    C('quick sort มี worst-case O(n²) ได้เมื่อใด?', ['แบ่ง pivot ทำให้ด้านหนึ่งแทบไม่มีสมาชิกซ้ำ ๆ', 'ทุก partition แบ่งครึ่งพอดี', 'ใช้ array ขนาด n', 'เรียก recursion ไม่เกิน log n'], 0, 'partition ไม่สมดุลทำให้ recurrence กลายเป็นงานสะสมกำลังสอง', 'ท้าทาย'),
    C('stable sorting หมายถึงอะไร?', ['สมาชิกที่มี key เท่ากันคงลำดับสัมพัทธ์เดิม', 'ผลลัพธ์เรียงจากน้อยไปมากเสมอ', 'ใช้พื้นที่เพิ่มไม่ได้', 'ทำงานได้ O(n) ทุกกรณี'], 0, 'stability รักษาลำดับเดิมของข้อมูลที่ key เท่ากัน'),
    T('binary search ใช้ได้ถูกต้องกับ array ที่ยังไม่เรียง โดยไม่ต้องปรับอัลกอริทึม', 1, 'การตัดครึ่งอาศัยข้อมูลที่เรียงแล้ว'),
    T('bubble sort แบบสลับเฉพาะเมื่อ a[j] > a[j+1] รักษาลำดับของค่าเท่ากันได้', 0, 'ค่าที่เท่ากันไม่ถูกสลับข้ามกัน จึง stable'),
    T('selection sort แบบพื้นฐานมี worst-case O(n²)', 0, 'แต่ละรอบค้นหาค่าน้อยสุดในส่วนที่เหลือ'),
    T('merge sort แบบมาตรฐานที่ใช้ temporary array เป็น in-place sort', 1, 'ต้องใช้พื้นที่เพิ่มตามจำนวนข้อมูล จึงไม่ถือว่า in-place แบบมาตรฐาน'),
    R('หลัง bubble sort pass แรกจากซ้ายไปขวา array เป็นอะไร?', 'int[] a = {4, 1, 3};\nfor (int j = 0; j < a.length - 1; j++)\n  if (a[j] > a[j + 1]) swap(a, j, j + 1);', ['{1, 3, 4}', '{1, 4, 3}', '{3, 1, 4}', '{4, 1, 3}'], 0, 'สลับ 4 กับ 1 ได้ {1,4,3}; แล้ว 4 กับ 3 ได้ {1,3,4}', 'ท้าทาย'),
    R('binary search ตรวจ index ใดเป็นค่ากลางครั้งแรก?', 'data = {2, 5, 8, 12, 16, 23, 38};\nlow = 0; high = 6;\nmid = (low + high) / 2;', ['2', '3', '4', '5'], 1, '(0 + 6) / 2 = 3 แบบ integer division'),
    R('จากข้อก่อน ถ้าค้นหา 16 แล้วตรวจ mid = 3 ซึ่งมีค่า 12 ต้องตั้งช่วงถัดไปอย่างไร?', 'low = 0; high = 6; mid = 3;', ['low = 0, high = 2', 'low = 4, high = 6', 'low = 3, high = 6', 'หยุดและรายงานไม่พบ'], 1, '16 มากกว่า 12 จึงทิ้งครึ่งซ้ายรวม mid แล้วค้นช่วง 4 ถึง 6'),
    R('หลัง selection sort pass แรก array กลายเป็นอะไร?', 'int[] a = {7, 4, 6, 2};\n// หา minimum ของช่วงทั้งหมดแล้ว swap กับ index 0', ['{2, 4, 6, 7}', '{4, 2, 6, 7}', '{2, 7, 6, 4}', '{7, 4, 6, 2}'], 0, 'ค่าน้อยสุด 2 ถูกสลับมา index 0; ที่เหลือยังเป็น 4, 6, 7', 'ท้าทาย'),
    R('merge สองช่วงที่เรียงแล้ว [1, 6] และ [2, 5] ได้ผลลัพธ์ใด?', 'compare front values and copy the smaller', ['[1, 6, 2, 5]', '[1, 2, 5, 6]', '[2, 1, 6, 5]', '[1, 2, 6, 5]'], 1, 'เปรียบเทียบ 1 กับ 2, แล้ว 6 กับ 2, 6 กับ 5 ก่อนเหลือ 6'),
    R('binary search แบบ inclusive interval จะหยุดเมื่อใดถ้าไม่พบค่า?', 'while (low <= high) { ... }', ['low == high', 'low > high', 'low < 0', 'mid == 0'], 1, 'เมื่อช่วงว่าง low จะมากกว่า high'),
    F('เติมการคำนวณ index กลางแบบลดโอกาส integer overflow', 'int mid = low + (____) / 2;', 'high - low', 'เทียบเท่า (low + high)/2 แต่หลีกเลี่ยงการบวกค่าขนาดใหญ่มาก'),
    F('เติมเงื่อนไขเลื่อนค่าสูงกว่าออกไปทางขวาใน insertion sort', 'while (j >= 0 && data[j] ____ key) {', '>', 'ค่ายิ่งใหญ่กว่า key ต้องเลื่อนไปทางขวาเพื่อเปิดตำแหน่งแทรก'),
    F('เติมค่าช่วงขวาหลังค้นหา key ที่มากกว่า data[mid] ใน inclusive binary search', 'low = mid ____ 1;', '+', 'ตัด mid ที่ตรวจแล้วออกและเริ่มจากตำแหน่งถัดไป'),
    F('เติม operator เพื่อให้ bubble sort สลับเฉพาะคู่ที่ผิดลำดับจากน้อยไปมาก', 'if (a[j] ____ a[j + 1]) swap(a, j, j + 1);', '>', 'สลับเมื่อสมาชิกซ้ายมากกว่าสมาชิกขวา'),
  ]
});

window.DSA_TOPICS.push({
  id: 'trees', title: 'Trees และ BST', icon: '⌘',
  description: 'เข้าใจความสัมพันธ์ parent/child, BST และ traversal',
  questions: [
    C('node ที่ไม่มีลูกใน tree เรียกว่าอะไร?', ['root', 'leaf', 'ancestor', 'edge'], 1, 'leaf คือ node ที่ไม่มี child'),
    C('ใน binary search tree แบบไม่เก็บ duplicate ด้วยกติกาซ้าย < node < ขวา ค่าที่น้อยกว่า node อยู่ด้านใด?', ['subtree ซ้าย', 'subtree ขวา', 'ตำแหน่งใดก็ได้', 'ต้องอยู่ที่ root'], 0, 'BST invariant จัดค่าที่น้อยกว่าลงทางซ้ายและค่ามากกว่าลงทางขวา'),
    C('การเดินแบบ preorder เยี่ยม node ตามลำดับใด?', ['ซ้าย, node, ขวา', 'node, ซ้าย, ขวา', 'ซ้าย, ขวา, node', 'ทุกระดับจากซ้ายไปขวา'], 1, 'preorder เยี่ยม root ก่อนแล้วจึงเดิน subtree ซ้ายและขวา'),
    C('การเดินแบบ inorder บน BST ที่ใช้กติกาซ้าย < node < ขวา ให้ผลแบบใด?', ['เรียงจากน้อยไปมาก', 'เรียงจากมากไปน้อยเสมอ', 'ตามระดับของ tree', 'ตามลำดับ insert เท่านั้น'], 0, 'inorder คือ left, node, right จึงอ่านค่าตามลำดับ sort'),
    C('ถ้า BST กลายเป็น chain จากการใส่ข้อมูลเรียงอยู่แล้ว worst-case search เป็นเท่าไร?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 2, 'ความสูงอาจเท่ากับ n ทำให้การค้นหาต้องเดินทีละ node', 'ท้าทาย'),
    C('ใน array representation ของ binary tree แบบ index เริ่มศูนย์ ลูกซ้ายของตำแหน่ง i อยู่ที่ใด?', ['2i', '2i + 1', '2i + 2', 'i + 1'], 1, 'สูตร zero-based คือ left = 2i+1 และ right = 2i+2'),
    T('root ของ tree มี depth เท่ากับ 0 เมื่อวัดจำนวน edges จาก root', 0, 'ไม่มี edge จาก root มาหาตัวเอง'),
    T('postorder traversal เยี่ยม root ก่อนลูกทั้งสอง subtree', 1, 'postorder เยี่ยม left, right แล้วจึง node'),
    T('breadth-first traversal ใช้ queue เพื่อประมวลผล node ทีละระดับ', 0, 'queue รักษาลำดับของ node ที่ค้นพบก่อนในระดับเดียวกัน'),
    T('BST ที่สมดุลมีความสูงประมาณ log n และ search ใช้เวลา O(log n)', 0, 'ใน tree ที่สมดุลแต่ละระดับลดบริเวณค้นหาลงอย่างมีนัยสำคัญ'),
    R('preorder ของ tree นี้คืออะไร?', '    A\n   / \\\n  B   C\n / \\\nD   E', ['A, B, D, E, C', 'D, B, E, A, C', 'D, E, B, C, A', 'A, B, C, D, E'], 0, 'เยี่ยม A ก่อน จากนั้น subtree B (B,D,E) แล้ว C'),
    R('inorder ของ binary tree นี้คืออะไร?', '    A\n   / \\\n  B   C\n / \\\nD   E', ['A, B, D, E, C', 'D, B, E, A, C', 'D, E, B, C, A', 'A, B, C, D, E'], 1, 'inorder เดินซ้ายก่อน: D, B, E, แล้ว A และ C'),
    R('postorder ของ tree นี้คืออะไร?', '    A\n   / \\\n  B   C\n / \\\nD   E', ['A, B, D, E, C', 'D, B, E, A, C', 'D, E, B, C, A', 'A, B, C, D, E'], 2, 'postorder เดิน subtree ซ้าย, subtree ขวา, แล้ว node'),
    R('breadth-first order ของ tree นี้คืออะไร?', '    A\n   / \\\n  B   C\n / \\\nD   E', ['A, B, C, D, E', 'A, B, D, E, C', 'D, B, E, A, C', 'D, E, B, C, A'], 0, 'BFS ใช้ queue จึงเยี่ยมระดับบนก่อน: A, B, C แล้ว D, E'),
    R('เริ่ม BST ว่างและ insert 8, 3, 10, 1, 6; parent ของ 6 คือใคร?', 'insert in the given order', ['8', '3', '10', '1'], 1, '8 ใหญ่กว่า 6 จึงไปซ้ายที่ 3; 3 เล็กกว่า 6 จึงใส่เป็นลูกขวาของ 3'),
    F('เติมลำดับ traversal ที่ใช้ใน-order สำหรับ node ปัจจุบัน p', 'inorder(p.left); visit(p); inorder(p.right);  =>  ____, node, ____', ['left, right', 'ซ้าย, ขวา'], 'inorder คือซ้ายก่อน node แล้วขวา'),
    F('เติม index ของลูกขวาใน zero-based array representation', 'rightIndex = ____;', '2 * i + 2', 'สูตรลูกขวา zero-based คือ 2i + 2'),
    F('เติมเงื่อนไขที่หยุด recursive preorder เมื่อไม่มี node', 'void preorder(Node p) {\n  if (____) return;', 'p == null', 'null pointer หมายถึง subtree ว่าง'),
    F('เติมกิ่งของ BST เมื่อค่าที่ insert น้อยกว่า node ปัจจุบัน', 'if (value < p.data) p = p.____;', 'left', 'ค่าที่น้อยกว่าต้องค้นหาหรือแทรกใน subtree ซ้าย'),
    F('tree สูง h edges มีจำนวน node สูงสุดในกรณี binary tree ใด?', 'maximum nodes = ____', '2^(h + 1) - 1', 'เมื่อทุกระดับเต็ม จำนวน node คือ 1 + 2 + ... + 2^h')
  ]
});

window.DSA_TOPICS.push({
  id: 'graphs', title: 'Graphs', icon: '◈',
  description: 'อ่าน vertex/edge, representation, BFS/DFS และชนิดของ path',
  questions: [
    C('กราฟ G = (V, E) ใช้ V และ E แทนอะไร?', ['V คือ vertices และ E คือ edges', 'V คือ values และ E คือ errors', 'V คือ vertices และ E คือ events ตามเวลาเท่านั้น', 'V คือ edges และ E คือ vertices'], 0, 'V คือเซตของจุดยอด และ E คือเซตของเส้นเชื่อม'),
    C('กราฟไม่กำกับแบบ simple ที่มี n vertices มากสุดมี edges กี่เส้น?', ['n²', 'n(n-1)/2', 'n(n+1)', '2n'], 1, 'เลือกคู่ vertices ที่ต่างกันได้ n choose 2 คู่'),
    C('ใน undirected graph degree ของ vertex คืออะไร?', ['จำนวน vertices ทั้งหมด', 'จำนวน edges ที่ incident กับ vertex นั้น', 'จำนวน cycles ในกราฟ', 'จำนวนเส้นทางที่เริ่มจาก root'], 1, 'degree นับ edges ที่ติดกับ vertex; self-loop มีผลตามนิยามที่ใช้'),
    C('เหตุใด adjacency matrix ใช้พื้นที่ O(V²) แม้กราฟมี edges น้อย?', ['เก็บช่องสำหรับคู่ vertex ทุกคู่', 'เก็บข้อมูลเฉพาะ edges จริง', 'เรียง vertices ทุกครั้ง', 'เพราะแต่ละ edge เก็บสองครั้งใน list'], 0, 'matrix มีแถวและคอลัมน์ตามจำนวน vertices ทั้งหมด'),
    C('BFS ใช้โครงสร้างใดเพื่อเยี่ยม vertices ตามชั้นระยะทาง?', ['Stack', 'Queue', 'Heap sort', 'Hash function'], 1, 'queue ทำให้ vertex ที่พบก่อนถูกขยายก่อน'),
    C('DFS มักใช้กลไกใดในการเดินลึกต่อไป?', ['Queue หรือ recursion/stack', 'เฉพาะ array ที่เรียงแล้ว', 'เฉพาะ hash table', 'เฉพาะ adjacency matrix ที่สมมาตร'], 0, 'DFS เก็บทางเดินที่ยังสำรวจไม่เสร็จด้วย stack หรือ call stack'),
    T('กราฟไม่กำกับมี adjacency matrix ที่สมมาตรเมื่อไม่มีข้อผิดพลาดในการจัดเก็บ', 0, 'ถ้า u เชื่อม v ก็ต้องมี v เชื่อม u'),
    T('Euler path สนใจผ่านทุก vertex อย่างน้อยหนึ่งครั้ง ส่วน Hamiltonian path สนใจทุก edge', 1, 'Euler ใช้ทุก edge ครั้งเดียว; Hamiltonian เยี่ยมทุก vertex ครั้งเดียว'),
    T('กราฟ connected หมายถึงมี path ระหว่างทุกคู่ vertex', 0, 'นี่คือความหมายของ connected graph'),
    T('BFS บน unweighted graph หาเส้นทางที่ใช้จำนวน edges น้อยที่สุดจากจุดเริ่มได้', 0, 'BFS เยี่ยมตามจำนวน edges จากจุดเริ่มทีละระดับ'),
    R('undirected complete graph มี 6 vertices มี edges กี่เส้น?', '|E| = n(n - 1) / 2', ['12', '15', '30', '36'], 1, '6×5/2 = 15'),
    R('degree ของ B ในกราฟเส้นเชื่อม AB, BC, BD, CD เท่ากับเท่าไร?', 'undirected graph', ['1', '2', '3', '4'], 2, 'มี AB, BC และ BD incident กับ B รวม 3 edges'),
    R('BFS เริ่มจาก A; เพื่อนบ้านเรียงตามตัวอักษร และ edges คือ AB, AC, BD, CE ลำดับเยี่ยมคืออะไร?', 'visit each vertex once', ['A, B, C, D, E', 'A, C, E, B, D', 'A, B, D, C, E', 'A, E, C, B, D'], 0, 'เริ่ม A ใส่ B,C ใน queue แล้วขยาย B ได้ D และ C ได้ E'),
    R('กราฟเดียวกันเริ่ม DFS จาก A และเพื่อนบ้านเรียงตามตัวอักษร ลำดับ preorder คืออะไร?', 'edges: AB, AC, BD, CE', ['A, B, D, C, E', 'A, B, C, D, E', 'A, C, E, B, D', 'A, E, C, B, D'], 0, 'DFS ลงทาง B ก่อนถึง D แล้ว backtrack ไป C ก่อน E'),
    R('ใน directed graph ถ้ามี edge A -> B แต่ไม่มี B -> A ข้อใดถูก?', 'directed edge', ['degree รวมของ A เพิ่มหนึ่งแบบเดียวกับกราฟไม่กำกับ', 'A มี out-edge ไป B แต่ B ไม่มี in-edge จาก A', 'ต้องถือว่า B -> A มีอยู่ด้วย', 'กราฟต้องเป็น complete'], 1, 'ทิศทางสำคัญ: A มี outgoing edge และ B มี incoming edge'),
    F('เติมขนาดของ adjacency matrix สำหรับกราฟที่มี V vertices', 'matrix dimensions = ____', 'V x V', 'หนึ่งแถวและหนึ่งคอลัมน์ต่อ vertex'),
    F('เติมสูตรจำนวน edges สูงสุดของ simple undirected graph', 'max edges = ____', 'n * (n - 1) / 2', 'แต่ละ edge เป็นคู่ vertex ที่ไม่ซ้ำกัน'),
    F('ใน BFS ให้เพิ่ม vertex ที่ค้นพบแล้วเข้า ____ เพื่อประมวลผลตามลำดับ', '____.add(neighbor);', 'queue', 'BFS ใช้ FIFO queue'),
    F('ก่อนเพิ่มเพื่อนบ้านลง BFS queue ควรตรวจว่า vertex ยังไม่ถูก ____', 'if (!____[v]) { ____[v] = true; ... }', 'visited', 'ทำเครื่องหมายป้องกันการวนซ้ำและการ enqueue ซ้ำ'),
    F('เติมคำที่ต่างกันในนิยาม: Euler path ใช้ทุก edge; Hamiltonian path เยี่ยมทุก ____', 'Hamiltonian path visits each ____ exactly once', 'vertex', 'Hamiltonian สนใจ vertices ไม่ใช่การใช้ทุก edge')
  ]
});

window.DSA_QUESTIONS = window.DSA_TOPICS.flatMap(topic =>
  topic.questions.map((q, index) => window.DSA_BUILD_RECORD(topic, q, index))
);
