export type WorkedExample = {
  title: string;
  prompt: string;
  code: string;
  answer: string;
  explanation: string;
};

const examples: Record<string, WorkedExample[][]> = {
  variables: [
    [
      { title: "Example 1 · store a value", prompt: "What does the final line print?", code: "lanterns = 3\nprint(lanterns)", answer: "3", explanation: "The assignment stores the integer 3 under the name lanterns. print reads that stored value." },
      { title: "Example 2 · update a value", prompt: "What is gems after the second assignment?", code: "gems = 4\ngems = gems + 2\nprint(gems)", answer: "6", explanation: "Python reads the old value 4, adds 2, then assigns the result back to gems." },
    ],
    [
      { title: "Example 1 · text joins", prompt: "What is printed?", code: 'left = "5"\nright = "2"\nprint(left + right)', answer: "52", explanation: "Both values are strings, so + joins their characters instead of adding them as numbers." },
      { title: "Example 2 · convert before math", prompt: "What is printed?", code: 'coins = "5"\nprint(int(coins) + 2)', answer: "7", explanation: "int converts the string to an integer before Python adds 2." },
    ],
    [
      { title: "Example 1 · reassignment", prompt: "What does score contain at the end?", code: "score = 8\nscore = score + 3\nprint(score)", answer: "11", explanation: "The second assignment uses the current score, 8, and stores 11 in the same name." },
      { title: "Example 2 · swap two values", prompt: "What does the last line print?", code: "left, right = 2, 9\nleft, right = right, left\nprint(left, right)", answer: "9 2", explanation: "Python evaluates both right-hand values first, then assigns them to the names on the left." },
    ],
  ],
  conditions: [
    [
      { title: "Example 1 · comparison gives a Boolean", prompt: "What does the comparison print?", code: "keys = 2\nprint(keys >= 1)", answer: "True", explanation: "Two is greater than or equal to one, so the comparison evaluates to True." },
      { title: "Example 2 · equality is a question", prompt: "What is printed?", code: "keys = 2\nprint(keys == 1)", answer: "False", explanation: "The == operator compares the values. It does not assign a new value to keys." },
    ],
    [
      { title: "Example 1 · choose one branch", prompt: "Which message is printed?", code: 'coins = 4\nif coins >= 5:\n    print("open")\nelse:\n    print("wait")', answer: "wait", explanation: "The condition is False, so Python skips the if block and runs the else block." },
      { title: "Example 2 · first matching branch", prompt: "What grade is printed?", code: 'score = 82\nif score >= 90:\n    grade = "A"\nelif score >= 70:\n    grade = "B"\nelse:\n    grade = "C"\nprint(grade)', answer: "B", explanation: "The first test is False. The elif test is True, so Python assigns B and skips the rest." },
    ],
    [
      { title: "Example 1 · both conditions must pass", prompt: "What is printed?", code: 'has_key = True\ncoins = 4\nif has_key and coins >= 5:\n    print("open")\nelse:\n    print("locked")', answer: "locked", explanation: "and needs both sides to be True. The coin check is False, so the whole condition is False." },
      { title: "Example 2 · group an alternative", prompt: "Does the explorer enter?", code: 'has_pass = False\nis_guest = True\nif has_pass or is_guest:\n    print("enter")\nelse:\n    print("wait")', answer: "enter", explanation: "or needs at least one True side. is_guest is True, so the entry branch runs." },
    ],
  ],
  loops: [
    [
      { title: "Example 1 · the stop is excluded", prompt: "Which numbers are printed?", code: "for step in range(1, 4):\n    print(step)", answer: "1, 2, and 3", explanation: "range starts at 1 and stops before 4, so the loop visits 1, 2, then 3." },
      { title: "Example 2 · use a step size", prompt: "Which numbers are printed?", code: "for step in range(2, 8, 2):\n    print(step)", answer: "2, 4, and 6", explanation: "The third range argument adds 2 each time. The loop stops before reaching 8." },
    ],
    [
      { title: "Example 1 · make progress in a while loop", prompt: "What is printed?", code: "fuel = 3\nwhile fuel > 0:\n    print(fuel)\n    fuel -= 1", answer: "3, 2, and 1", explanation: "fuel decreases on each pass. When it reaches 0, the condition is False and the loop stops." },
      { title: "Example 2 · skip one visit", prompt: "What is the final total?", code: "total = 0\nfor step in range(4):\n    if step == 2:\n        continue\n    total += step\nprint(total)", answer: "4", explanation: "continue skips the addition for 2. The loop adds 0, 1, and 3, which totals 4." },
    ],
    [
      { title: "Example 1 · nested loops", prompt: "How many pairs are printed?", code: "for row in range(2):\n    for col in range(3):\n        print(row, col)", answer: "6 pairs", explanation: "The inner loop runs 3 times for each of the 2 outer-loop visits: 2 × 3 = 6." },
      { title: "Example 2 · accumulate selected values", prompt: "What is the final total?", code: "total = 0\nfor value in range(6):\n    if value % 2 == 0:\n        total += value\nprint(total)", answer: "6", explanation: "Only 0, 2, and 4 pass the even-number check. Their sum is 6." },
    ],
  ],
  lists: [
    [
      { title: "Example 1 · indexes start at zero", prompt: "What is printed?", code: 'gems = ["map", "key"]\nprint(gems[0])', answer: "map", explanation: "Index 0 points to the first list item." },
      { title: "Example 2 · append adds to the end", prompt: "What does the list contain?", code: 'gems = ["map"]\ngems.append("key")\nprint(gems)', answer: "['map', 'key']", explanation: "append changes the list by adding key after the existing map item." },
    ],
    [
      { title: "Example 1 · length and last index", prompt: "What are the length and last item?", code: 'gems = ["map", "key"]\nprint(len(gems))\nprint(gems[len(gems) - 1])', answer: "2, then key", explanation: "There are two items, at indexes 0 and 1. The last index is length minus one." },
      { title: "Example 2 · slice stops before its endpoint", prompt: "What is selected?", code: "scores = [10, 20, 30, 40]\nprint(scores[1:3])", answer: "[20, 30]", explanation: "The slice starts at index 1 and stops before index 3." },
    ],
    [
      { title: "Example 1 · make an independent copy", prompt: "What are the two lists?", code: "first = [1, 2]\nsecond = first.copy()\nsecond.append(3)\nprint(first, second)", answer: "[1, 2] [1, 2, 3]", explanation: "copy creates a separate outer list, so appending to second does not change first." },
      { title: "Example 2 · nested lists can share inner items", prompt: "What does boxes contain?", code: "items = [[1], [2]]\nboxes = items.copy()\nboxes[0].append(9)\nprint(items)", answer: "[[1, 9], [2]]", explanation: "The outer list was copied, but the inner list [1] is shared by both outer lists." },
    ],
  ],
  functions: [
    [
      { title: "Example 1 · define, then call", prompt: "What is printed?", code: 'def greet():\n    print("hello")\n\ngreet()', answer: "hello", explanation: "The function body runs when greet() is called, not when the definition is read." },
      { title: "Example 2 · pass an argument", prompt: "What is printed?", code: "def double(number):\n    print(number * 2)\n\ndouble(3)", answer: "6", explanation: "The argument 3 is assigned to the parameter number, then multiplied by 2." },
    ],
    [
      { title: "Example 1 · return sends a value back", prompt: "What does result contain?", code: "def add_one(number):\n    return number + 1\n\nresult = add_one(4)\nprint(result)", answer: "5", explanation: "return sends 5 to the caller, which stores it in result." },
      { title: "Example 2 · local names stay inside", prompt: "What is printed?", code: "def make_score():\n    score = 7\n    return score\n\nprint(make_score())", answer: "7", explanation: "score is local to the function. Its returned value is available to the caller." },
    ],
    [
      { title: "Example 1 · compose function results", prompt: "What is printed?", code: "def double(value):\n    return value * 2\n\ndef add_one(value):\n    return value + 1\n\nprint(add_one(double(3)))", answer: "7", explanation: "double(3) returns 6. add_one receives 6 and returns 7." },
      { title: "Example 2 · stop recursion at a base case", prompt: "What does countdown(3) return?", code: "def countdown(n):\n    if n == 0:\n        return 0\n    return n + countdown(n - 1)\n\nprint(countdown(3))", answer: "6", explanation: "The calls add 3 + 2 + 1, then the base case returns 0 and stops the recursion." },
    ],
  ],
};

export function examplesForLesson(topic: string, lessonIndex: number): WorkedExample[] {
  return examples[topic]?.[lessonIndex] ?? [];
}
