export type Difficulty = "easy" | "medium" | "hard";

export interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
  hidden?: boolean;
}

export interface PracticeQuestion {
  id: string;
  number: number;
  difficulty: Difficulty;
  title: string;
  summary: string;
  description: string;
  instructions: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  starterCode: string;
  solutionCode: string;
  solutionExplanation: string;
  testCases: TestCase[];
  hints: string[];
}

export const PRACTICE_QUESTIONS: Record<Difficulty, PracticeQuestion[]> = {
  easy: [
    {
      id: "easy-1-hello-world",
      number: 1,
      difficulty: "easy",
      title: "Hello World",
      summary: "Write a Python program to print Hello World.",
      description:
        "Write a Python program that outputs the message Hello World to standard output.",
      instructions: [
        "Use Python's built-in print() function.",
        "Output the exact text: Hello World",
        "Make sure spelling and uppercase letters match.",
      ],
      examples: [
        {
          input: "(none)",
          output: "Hello World",
          explanation: "Prints Hello World on a single line.",
        },
      ],
      starterCode: "",
      solutionCode: `print("Hello World")`,
      solutionExplanation:
        "In Python, the print() function sends text directly to the console output. Text strings are enclosed in quotation marks.",
      testCases: [
        {
          input: "",
          expectedOutput: "Hello World",
          description: "Hello World check",
        },
      ],
      hints: [
        "Enclose Hello World in quotes inside print(...)",
        "Remember print is all lowercase.",
      ],
    },
    {
      id: "easy-2-addition",
      number: 2,
      difficulty: "easy",
      title: "Addition",
      summary: "Take two numbers as input and print their sum.",
      description:
        "Read two integers from input (each on its own line) and print their arithmetic sum.",
      instructions: [
        "Read the first number using int(input()).",
        "Read the second number using int(input()).",
        "Compute their sum and print the result.",
      ],
      examples: [
        {
          input: "5\n7",
          output: "12",
          explanation: "5 + 7 = 12",
        },
        {
          input: "100\n250",
          output: "350",
          explanation: "100 + 250 = 350",
        },
      ],
      starterCode: "",
      solutionCode: `a = int(input())\nb = int(input())\nprint(a + b)`,
      solutionExplanation:
        "input() returns a string. Wrapping it in int() converts it to a number so the + operator performs addition instead of string joining.",
      testCases: [
        {
          input: "5\n7",
          expectedOutput: "12",
          description: "Positive numbers (5 + 7)",
        },
        {
          input: "100\n250",
          expectedOutput: "350",
          description: "Numbers (100 + 250)",
        },
        {
          input: "-10\n15",
          expectedOutput: "5",
          description: "Negative and positive (-10 + 15)",
        },
        {
          input: "0\n0",
          expectedOutput: "0",
          description: "Zero check (0 + 0)",
        },
      ],
      hints: [
        "Convert input() to int() before adding.",
        "Print the sum using print(a + b).",
      ],
    },
    {
      id: "easy-3-even-or-odd",
      number: 3,
      difficulty: "easy",
      title: "Even or Odd",
      summary: "Take a number as input and check whether it is even or odd.",
      description:
        "An integer is even if it is divisible by 2 with no remainder. Otherwise, it is odd.",
      instructions: [
        "Read an integer using int(input()).",
        "Use the modulo operator % to test if number % 2 == 0.",
        "Print Even if divisible by 2, or Odd if not.",
      ],
      examples: [
        {
          input: "4",
          output: "Even",
          explanation: "4 % 2 is 0, so 4 is Even.",
        },
        {
          input: "7",
          output: "Odd",
          explanation: "7 % 2 is 1, so 7 is Odd.",
        },
      ],
      starterCode: "",
      solutionCode: `num = int(input())\nif num % 2 == 0:\n    print("Even")\nelse:\n    print("Odd")`,
      solutionExplanation:
        "The modulo operator (%) calculates the remainder. If num % 2 == 0, the number has no remainder when divided by 2, so it is even.",
      testCases: [
        {
          input: "4",
          expectedOutput: "Even",
          description: "Even number (4)",
        },
        {
          input: "7",
          expectedOutput: "Odd",
          description: "Odd number (7)",
        },
        {
          input: "0",
          expectedOutput: "Even",
          description: "Zero check (0 is Even)",
        },
        {
          input: "99",
          expectedOutput: "Odd",
          description: "Odd number (99)",
        },
      ],
      hints: [
        "Check if num % 2 == 0 using an if statement.",
        "Print exactly 'Even' or 'Odd'.",
      ],
    },
  ],
  medium: [
    {
      id: "medium-4-factorial",
      number: 4,
      difficulty: "medium",
      title: "Factorial",
      summary: "Write a program to find the factorial of a number.",
      description:
        "The factorial of an integer N (N!) is the product of all positive integers from 1 up to N. 0! is defined as 1.",
      instructions: [
        "Read an integer N using int(input()).",
        "Initialize an accumulator variable fact = 1.",
        "Use a loop to multiply each integer from 1 up to N.",
        "Print the final factorial value.",
      ],
      examples: [
        {
          input: "5",
          output: "120",
          explanation: "5! = 5 * 4 * 3 * 2 * 1 = 120",
        },
        {
          input: "0",
          output: "1",
          explanation: "0! is defined as 1.",
        },
      ],
      starterCode: "",
      solutionCode: `n = int(input())\nfact = 1\nfor i in range(1, n + 1):\n    fact *= i\nprint(fact)`,
      solutionExplanation:
        "Starting with fact = 1 and iterating with range(1, n + 1) ensures all integers up to and including n are multiplied together.",
      testCases: [
        {
          input: "5",
          expectedOutput: "120",
          description: "Factorial of 5",
        },
        {
          input: "4",
          expectedOutput: "24",
          description: "Factorial of 4",
        },
        {
          input: "0",
          expectedOutput: "1",
          description: "Factorial of 0",
        },
        {
          input: "6",
          expectedOutput: "720",
          description: "Factorial of 6",
        },
      ],
      hints: [
        "Initialize your total to 1, not 0.",
        "Remember range(1, n + 1) includes n.",
      ],
    },
    {
      id: "medium-5-palindrome",
      number: 5,
      difficulty: "medium",
      title: "Palindrome",
      summary: "Check whether a given number or word is a palindrome.",
      description:
        "A palindrome reads the same forward and backward. Example: 121 -> Palindrome, 123 -> Not Palindrome.",
      instructions: [
        "Read the input using input().strip().",
        "Check whether the string is equal to its reversed form.",
        "Print Palindrome if it matches, or Not Palindrome otherwise.",
      ],
      examples: [
        {
          input: "121",
          output: "Palindrome",
          explanation: "121 reversed is 121, so it is a Palindrome.",
        },
        {
          input: "123",
          output: "Not Palindrome",
          explanation: "123 reversed is 321, so it is Not Palindrome.",
        },
      ],
      starterCode: "",
      solutionCode: `s = input().strip()\nif s == s[::-1]:\n    print("Palindrome")\nelse:\n    print("Not Palindrome")`,
      solutionExplanation:
        "The slice syntax s[::-1] creates a reversed copy of the string. Comparing s == s[::-1] checks symmetry directly.",
      testCases: [
        {
          input: "121",
          expectedOutput: "Palindrome",
          description: "Number palindrome (121)",
        },
        {
          input: "123",
          expectedOutput: "Not Palindrome",
          description: "Number not palindrome (123)",
        },
        {
          input: "radar",
          expectedOutput: "Palindrome",
          description: "Word palindrome (radar)",
        },
        {
          input: "10",
          expectedOutput: "Not Palindrome",
          description: "Two-digit non-palindrome (10)",
        },
      ],
      hints: [
        "In Python, s[::-1] reverses a string.",
        "Print 'Palindrome' or 'Not Palindrome'.",
      ],
    },
    {
      id: "medium-6-fibonacci-series",
      number: 6,
      difficulty: "medium",
      title: "Fibonacci Series",
      summary: "Print the first N numbers of the Fibonacci series.",
      description:
        "The Fibonacci sequence starts with 0 and 1. Each subsequent term is the sum of the two preceding terms (0, 1, 1, 2, 3, 5, 8...).",
      instructions: [
        "Read an integer N with int(input()).",
        "Start with a = 0 and b = 1.",
        "Generate N terms and print them separated by a single space.",
      ],
      examples: [
        {
          input: "5",
          output: "0 1 1 2 3",
          explanation: "First 5 Fibonacci numbers.",
        },
        {
          input: "1",
          output: "0",
          explanation: "First term is 0.",
        },
      ],
      starterCode: "",
      solutionCode: `n = int(input())\na, b = 0, 1\nterms = []\nfor _ in range(n):\n    terms.append(str(a))\n    a, b = b, a + b\nprint(" ".join(terms))`,
      solutionExplanation:
        "We maintain current term a and next term b. Using a, b = b, a + b updates both state values in one step.",
      testCases: [
        {
          input: "5",
          expectedOutput: "0 1 1 2 3",
          description: "First 5 Fibonacci terms",
        },
        {
          input: "7",
          expectedOutput: "0 1 1 2 3 5 8",
          description: "First 7 Fibonacci terms",
        },
        {
          input: "1",
          expectedOutput: "0",
          description: "First 1 Fibonacci term",
        },
        {
          input: "2",
          expectedOutput: "0 1",
          description: "First 2 Fibonacci terms",
        },
      ],
      hints: [
        "Collect terms in a list and use ' '.join(...) to print with spaces.",
        "Update variables with a, b = b, a + b in each iteration.",
      ],
    },
  ],
  hard: [
    {
      id: "hard-7-second-largest",
      number: 7,
      difficulty: "hard",
      title: "Second Largest",
      summary: "Find the second-largest number in a list without using sort().",
      description:
        "Given space-separated numbers, find and print the second-largest distinct number without using .sort() or sorted().",
      instructions: [
        "Read numbers: nums = [int(x) for x in input().split()].",
        "Keep track of the largest and second largest numbers.",
        "Iterate through the list and update the values conditionally.",
        "Print the second largest value.",
      ],
      examples: [
        {
          input: "12 35 1 10 34 1",
          output: "34",
          explanation: "Largest is 35, second largest is 34.",
        },
        {
          input: "10 5 10",
          output: "5",
          explanation: "Largest is 10, second largest distinct is 5.",
        },
      ],
      starterCode: "",
      solutionCode: `nums = [int(x) for x in input().split()]\nfirst = second = float('-inf')\nfor n in nums:\n    if n > first:\n        second = first\n        first = n\n    elif n > second and n != first:\n        second = n\nprint(second if second != float('-inf') else "None")`,
      solutionExplanation:
        "Tracking first and second in a single loop allows finding the second largest value in O(N) linear time without sorting.",
      testCases: [
        {
          input: "12 35 1 10 34 1",
          expectedOutput: "34",
          description: "List with distinct second largest (34)",
        },
        {
          input: "10 5 10",
          expectedOutput: "5",
          description: "List with duplicate maximums (10, 5, 10)",
        },
        {
          input: "100 200 300 400",
          expectedOutput: "300",
          description: "Ascending list (300)",
        },
        {
          input: "-10 -5 -20 -1",
          expectedOutput: "-5",
          description: "Negative numbers (-10, -5, -20, -1)",
        },
      ],
      hints: [
        "Do not use sort() or sorted().",
        "Initialize tracking variables to float('-inf').",
      ],
    },
    {
      id: "hard-8-remove-duplicates",
      number: 8,
      difficulty: "hard",
      title: "Remove Duplicates",
      summary: "Remove duplicate elements from a list without using set().",
      description:
        "Given space-separated numbers, remove duplicates while preserving the original order of occurrence, without using set().",
      instructions: [
        "Read numbers: nums = [int(x) for x in input().split()].",
        "Create an empty list unique = [].",
        "Iterate over nums and append each item if it is not already in unique.",
        "Print the unique numbers separated by a space.",
      ],
      examples: [
        {
          input: "1 2 2 3 4 4 5",
          output: "1 2 3 4 5",
          explanation: "Duplicates removed in order.",
        },
        {
          input: "10 20 10 30 20",
          output: "10 20 30",
          explanation: "First occurrences (10, 20, 30) are kept.",
        },
      ],
      starterCode: "",
      solutionCode: `nums = [int(x) for x in input().split()]\nunique = []\nfor item in nums:\n    if item not in unique:\n        unique.append(item)\nprint(" ".join(map(str, unique)))`,
      solutionExplanation:
        "Checking membership with 'if item not in unique' ensures each element is only appended once, maintaining original order without using set().",
      testCases: [
        {
          input: "1 2 2 3 4 4 5",
          expectedOutput: "1 2 3 4 5",
          description: "Adjacent duplicates (1 2 2 3 4 4 5)",
        },
        {
          input: "10 20 10 30 20",
          expectedOutput: "10 20 30",
          description: "Non-adjacent duplicates (10 20 10 30 20)",
        },
        {
          input: "7 7 7 7",
          expectedOutput: "7",
          description: "Identical elements (7 7 7 7)",
        },
        {
          input: "1 2 3",
          expectedOutput: "1 2 3",
          description: "Unique list (1 2 3)",
        },
      ],
      hints: [
        "Do not use set(). Use a new list to store first occurrences.",
        "Check if item not in unique before appending.",
      ],
    },
    {
      id: "hard-9-prime-number",
      number: 9,
      difficulty: "hard",
      title: "Prime Number",
      summary: "Check whether a given number is prime.",
      description:
        "A prime number is an integer greater than 1 that cannot be formed by multiplying two smaller positive integers.",
      instructions: [
        "Read an integer N using int(input()).",
        "If n <= 1, it is not prime.",
        "Check divisibility from 2 up to int(n**0.5) + 1.",
        "Print Prime if no divisor is found, otherwise Not Prime.",
      ],
      examples: [
        {
          input: "7",
          output: "Prime",
          explanation: "7 has no divisors other than 1 and 7.",
        },
        {
          input: "12",
          output: "Not Prime",
          explanation: "12 is divisible by 2, 3, 4, and 6.",
        },
      ],
      starterCode: "",
      solutionCode: `n = int(input())\nif n <= 1:\n    print("Not Prime")\nelse:\n    is_prime = True\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            is_prime = False\n            break\n    print("Prime" if is_prime else "Not Prime")`,
      solutionExplanation:
        "Numbers less than or equal to 1 are not prime. Checking factors up to the square root of n is sufficient to determine primality.",
      testCases: [
        {
          input: "7",
          expectedOutput: "Prime",
          description: "Prime number (7)",
        },
        {
          input: "12",
          expectedOutput: "Not Prime",
          description: "Composite number (12)",
        },
        {
          input: "1",
          expectedOutput: "Not Prime",
          description: "Edge case (1 is Not Prime)",
        },
        {
          input: "29",
          expectedOutput: "Prime",
          description: "Prime number (29)",
        },
      ],
      hints: [
        "1 is not a prime number.",
        "Loop up to int(n**0.5) + 1 to test factors.",
      ],
    },
  ],
};
